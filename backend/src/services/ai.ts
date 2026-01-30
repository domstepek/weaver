import Anthropic from '@anthropic-ai/sdk';
import { VoyageAIClient } from 'voyageai';
import { and, eq, ne, sql } from 'drizzle-orm';
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
): Promise<Node[]> {
  const embeddingStr = `[${embedding.join(',')}]`;

  const query = db
    .select()
    .from(nodes)
    .where(
      and(
        eq(nodes.userId, userId),
        sql`${nodes.embedding} IS NOT NULL`,
        excludeNodeId ? ne(nodes.id, excludeNodeId) : sql`true`,
      ),
    )
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
