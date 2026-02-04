import Anthropic from '@anthropic-ai/sdk';
import { VoyageAIClient } from 'voyageai';
import { and, eq, inArray, ne, sql } from 'drizzle-orm';
import { db, type Node, nodes } from '../db/index.js';

const anthropic = new Anthropic();
const voyage = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY,
});

// Generate embedding using Voyage AI
// Uses voyage-3.5-lite model which is optimized for retrieval and cost-effective
// Free tier: 200M tokens per account
// Output dimension: 1024 (default for voyage-3.5-lite)
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await voyage.embed({
    input: text,
    model: 'voyage-3.5-lite',
    outputDimension: 1024,
  });

  if (!response.data?.[0]?.embedding) {
    throw new Error('Failed to generate embedding from Voyage AI');
  }

  return response.data[0].embedding;
}

// Find semantically similar nodes for a user
export async function findSimilarNodes(
  userId: string,
  embedding: number[],
  limit: number = 5,
  excludeNodeId?: string,
  allowedNodeIds?: string[],
): Promise<Node[]> {
  if (allowedNodeIds && allowedNodeIds.length === 0) {
    return [];
  }

  const embeddingStr = `[${embedding.join(',')}]`;
  const whereConditions = [
    eq(nodes.userId, userId),
    sql`${nodes.embedding} IS NOT NULL`,
    excludeNodeId ? ne(nodes.id, excludeNodeId) : sql`true`,
  ];

  if (allowedNodeIds && allowedNodeIds.length > 0) {
    whereConditions.push(inArray(nodes.id, allowedNodeIds));
  }

  const query = db
    .select()
    .from(nodes)
    .where(and(...whereConditions))
    .orderBy(sql`${nodes.embedding} <=> ${embeddingStr}::vector`)
    .limit(limit);

  return query;
}

// Format nodes as context for Claude
export function formatNodesAsContext(nodeList: Node[]): string {
  if (nodeList.length === 0) return '';

  const formatted = nodeList
    .map((node) => {
      const name = node.name || `Node-${node.id.slice(0, 8)}`;
      return `[${name}](${node.id}):\n${node.content}`;
    })
    .join('\n\n---\n\n');

  return `## Relevant Context from Your Knowledge Graph\n\n${formatted}`;
}

// Generate a concise name/summary for a node using Claude
export async function generateNodeName(content: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 50,
      temperature: 0.7,
      system: `You are a helpful assistant that creates very short, descriptive titles for text content. Generate a concise title (3-8 words max) that captures the main idea. Do not use quotes or special formatting - just return the plain text title.`,
      messages: [
        {
          role: 'user',
          content: `Create a short, descriptive title for this content:\n\n${content.slice(0, 1000)}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const generatedName = textBlock?.text?.trim() || '';

    // Truncate to max 200 chars if needed and clean up
    return generatedName.slice(0, 200).replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error('Error generating node name:', error);
    // Fallback to first few words if API fails
    return content.slice(0, 50).trim() + (content.length > 50 ? '...' : '');
  }
}

// Parse node references from text (format: [NodeName](nodeId))
export function parseNodeReferences(text: string): string[] {
  const regex = /\[([^\]]+)\]\(([a-f0-9-]{36})\)/g;
  const nodeIds: string[] = [];
  let match = regex.exec(text);

  while (match !== null) {
    nodeIds.push(match[2]);
    match = regex.exec(text);
  }

  return [...new Set(nodeIds)];
}

// Chat with Claude
export async function chat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: string,
): Promise<string> {
  const systemPrompt = `You are a helpful AI assistant integrated into Weaver, a knowledge graph-based chat application.
Users can save important ideas as nodes in their personal knowledge graph and reference them across conversations.

${context ? `${context}\n\n` : ''}Please format your responses using Markdown for better readability:
- Use **bold** and *italic* for emphasis
- Use \`code\` for inline code and \`\`\`language blocks for code snippets
- Use lists, tables, and other markdown features where appropriate
- Keep formatting clean and purposeful

When referring to nodes from the user's knowledge graph, use the format [NodeName](nodeId) so the references can be linked in the UI.

Help users explore their ideas, make connections between concepts, and build upon their existing knowledge. Be concise but thorough.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock ? textBlock.text : '';
}

// Chat with Claude using streaming
export async function* chatStream(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: string,
): AsyncGenerator<string, void, unknown> {
  const systemPrompt = `You are a helpful AI assistant integrated into Weaver, a knowledge graph-based chat application.
Users can save important ideas as nodes in their personal knowledge graph and reference them across conversations.

${context ? `${context}\n\n` : ''}Please format your responses using Markdown for better readability:
- Use **bold** and *italic* for emphasis
- Use \`code\` for inline code and \`\`\`language blocks for code snippets
- Use lists, tables, and other markdown features where appropriate
- Keep formatting clean and purposeful

When referring to nodes from the user's knowledge graph, use the format [NodeName](nodeId) so the references can be linked in the UI.

Help users explore their ideas, make connections between concepts, and build upon their existing knowledge. Be concise but thorough.`;

  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    stream: true,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}
