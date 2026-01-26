import Anthropic from '@anthropic-ai/sdk';
import { and, eq, ne, sql } from 'drizzle-orm';
import { db, type Node, nodes } from '../db/index.js';

const anthropic = new Anthropic();

// Generate embedding using Anthropic's voyage model via the messages API
// Note: Anthropic doesn't have a direct embedding API, so we'll use a workaround
// For production, you'd use OpenAI's embedding API or Voyage AI directly
// Here we'll use a simple hash-based mock for development, or you can integrate OpenAI
export async function generateEmbedding(text: string): Promise<number[]> {
  // For a real implementation, you'd use OpenAI's embedding API or Voyage AI
  // This is a placeholder that creates a deterministic embedding based on text
  // In production, replace with:
  // const openai = new OpenAI();
  // const response = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text });
  // return response.data[0].embedding;

  // Simple deterministic embedding for development
  const embedding = new Array(1536).fill(0);
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    embedding[i % 1536] += charCode / 1000;
    embedding[(i * 7) % 1536] += charCode / 2000;
    embedding[(i * 13) % 1536] += charCode / 3000;
  }

  // Normalize the embedding
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0),
  );
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
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
  let match;

  while ((match = regex.exec(text)) !== null) {
    nodeIds.push(match[2]);
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

${context ? context + '\n\n' : ''}When referring to nodes from the user's knowledge graph, use the format [NodeName](nodeId) so the references can be linked in the UI.

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
