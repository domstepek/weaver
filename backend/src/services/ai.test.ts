import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node } from '../db/schema.js';
import {
  chat,
  chatStream,
  findSimilarNodes,
  formatNodesAsContext,
  generateEmbedding,
  generateNodeName,
  parseNodeReferences,
} from './ai.js';

const {
  mockAnthropicCreate,
  mockDbLimit,
  mockDbSelect,
  mockVoyageEmbed,
} = vi.hoisted(() => {
  const dbLimit = vi.fn();
  const dbOrderBy = vi.fn(() => ({ limit: dbLimit }));
  const dbWhere = vi.fn(() => ({ orderBy: dbOrderBy }));
  const dbFrom = vi.fn(() => ({ where: dbWhere }));
  const dbSelect = vi.fn(() => ({ from: dbFrom }));

  return {
    mockAnthropicCreate: vi.fn(),
    mockDbFrom: dbFrom,
    mockDbLimit: dbLimit,
    mockDbOrderBy: dbOrderBy,
    mockDbSelect: dbSelect,
    mockDbWhere: dbWhere,
    mockVoyageEmbed: vi.fn(),
  };
});

function makeDeterministicEmbedding(input: string): number[] {
  const embedding = new Array(1024).fill(0);
  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i);
    embedding[i % 1024] += charCode / 1000;
    embedding[(i * 7) % 1024] += charCode / 2000;
    embedding[(i * 13) % 1024] += charCode / 3000;
  }

  const magnitude = Math.sqrt(
    embedding.reduce((sum, value) => sum + value * value, 0),
  );
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

vi.mock('voyageai', () => {
  class MockVoyageAIClient {
    embed = mockVoyageEmbed;
  }

  return { VoyageAIClient: MockVoyageAIClient };
});

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = {
      create: mockAnthropicCreate,
    };
  }

  return {
    default: MockAnthropic,
  };
});

vi.mock('../db/index.js', async () => {
  const actual = await vi.importActual('../db/index.js');
  return {
    ...actual,
    db: {
      select: mockDbSelect,
    },
  };
});

describe('AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVoyageEmbed.mockImplementation(({ input }: { input: string }) => {
      return Promise.resolve({
        data: [{ embedding: makeDeterministicEmbedding(input) }],
      });
    });
  });

  describe('generateEmbedding', () => {
    it('should generate a 1024-dimensional embedding', async () => {
      const embedding = await generateEmbedding('This is a test');
      expect(embedding).toHaveLength(1024);
    });

    it('should generate deterministic embeddings for the same input', async () => {
      const text = 'Consistent input';
      const embedding1 = await generateEmbedding(text);
      const embedding2 = await generateEmbedding(text);

      expect(embedding1).toEqual(embedding2);
    });

    it('should generate normalized embeddings', async () => {
      const embedding = await generateEmbedding('Normalize me');
      const magnitude = Math.sqrt(
        embedding.reduce((sum, value) => sum + value * value, 0),
      );

      expect(magnitude).toBeCloseTo(1, 5);
    });

    it('should generate different embeddings for different inputs', async () => {
      const embedding1 = await generateEmbedding('First text');
      const embedding2 = await generateEmbedding('Second text');

      expect(embedding1).not.toEqual(embedding2);
    });

    it('should throw when voyage response has no embedding', async () => {
      mockVoyageEmbed.mockResolvedValueOnce({ data: [{}] });

      await expect(generateEmbedding('bad result')).rejects.toThrow(
        'Failed to generate embedding from Voyage AI',
      );
    });
  });

  describe('findSimilarNodes', () => {
    it('should return empty list immediately when allowedNodeIds is empty', async () => {
      const result = await findSimilarNodes('user-1', [0.1, 0.2], 5, undefined, []);

      expect(result).toEqual([]);
      expect(mockDbSelect).not.toHaveBeenCalled();
    });

    it('should run DB query with filters and custom limit', async () => {
      const expectedNodes: Node[] = [
        {
          id: '12345678-1234-1234-1234-123456789abc',
          userId: 'user-1',
          content: 'first',
          name: 'First',
          isPinned: false,
          embedding: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockDbLimit.mockResolvedValueOnce(expectedNodes);

      const result = await findSimilarNodes(
        'user-1',
        [0.12, 0.34],
        3,
        'node-to-exclude',
        ['allowed-1'],
      );

      expect(result).toEqual(expectedNodes);
      expect(mockDbSelect).toHaveBeenCalledTimes(1);
      expect(mockDbLimit).toHaveBeenCalledWith(3);
    });

    it('should use default limit and skip inArray when allowedNodeIds is undefined', async () => {
      mockDbLimit.mockResolvedValueOnce([]);

      await findSimilarNodes('user-2', [0.99], undefined, undefined, undefined);

      expect(mockDbSelect).toHaveBeenCalledTimes(1);
      expect(mockDbLimit).toHaveBeenCalledWith(5);
    });
  });

  describe('parseNodeReferences', () => {
    it('should parse node references from text', () => {
      const text =
        'Check out [My Node](12345678-1234-1234-1234-123456789abc) and [Another](87654321-4321-4321-4321-cba987654321)';
      const nodeIds = parseNodeReferences(text);

      expect(nodeIds).toEqual([
        '12345678-1234-1234-1234-123456789abc',
        '87654321-4321-4321-4321-cba987654321',
      ]);
    });

    it('should return empty array when no references found', () => {
      const nodeIds = parseNodeReferences('This text has no node references');
      expect(nodeIds).toEqual([]);
    });

    it('should handle duplicate node references', () => {
      const text =
        '[Node](12345678-1234-1234-1234-123456789abc) and [Same Node](12345678-1234-1234-1234-123456789abc)';
      const nodeIds = parseNodeReferences(text);

      expect(nodeIds).toEqual(['12345678-1234-1234-1234-123456789abc']);
    });

    it('should only match valid UUID format', () => {
      const text =
        '[Invalid](not-a-uuid) [Valid](12345678-1234-1234-1234-123456789abc)';
      const nodeIds = parseNodeReferences(text);

      expect(nodeIds).toEqual(['12345678-1234-1234-1234-123456789abc']);
    });
  });

  describe('formatNodesAsContext', () => {
    const mockNode: Node = {
      id: '12345678-1234-1234-1234-123456789abc',
      userId: 'user-123',
      content: 'This is the node content',
      name: 'Test Node',
      isPinned: false,
      embedding: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should format nodes with names', () => {
      const context = formatNodesAsContext([mockNode]);

      expect(context).toContain('Test Node');
      expect(context).toContain('12345678-1234-1234-1234-123456789abc');
      expect(context).toContain('This is the node content');
      expect(context).toContain('Relevant Context from Your Knowledge Graph');
    });

    it('should use node ID when name is not provided', () => {
      const context = formatNodesAsContext([{ ...mockNode, name: null }]);

      expect(context).toContain('Node-12345678');
      expect(context).toContain('This is the node content');
    });

    it('should return empty string for empty node list', () => {
      const context = formatNodesAsContext([]);
      expect(context).toBe('');
    });

    it('should format multiple nodes with separators', () => {
      const node2: Node = {
        ...mockNode,
        id: '87654321-4321-4321-4321-cba987654321',
        name: 'Second Node',
        content: 'Second node content',
      };

      const context = formatNodesAsContext([mockNode, node2]);

      expect(context).toContain('Test Node');
      expect(context).toContain('Second Node');
      expect(context).toContain('---');
    });
  });

  describe('generateNodeName', () => {
    it('should return trimmed and cleaned Claude response', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: '"  Useful title  "' }],
      });

      const result = await generateNodeName('Some content for naming');
      expect(result).toBe('  Useful title  ');
    });

    it('should return fallback when Claude returns empty text block', async () => {
      const content = 'x'.repeat(55);
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: '   ' }],
      });

      const result = await generateNodeName(content);
      expect(result).toBe(`${'x'.repeat(50)}...`);
    });

    it('should return fallback when Claude throws', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockAnthropicCreate.mockRejectedValueOnce(new Error('API error'));

      const result = await generateNodeName('Short fallback');
      expect(result).toBe('Short fallback');

      consoleErrorSpy.mockRestore();
    });

    it('should truncate generated title to 200 chars', async () => {
      const longName = `"${'a'.repeat(300)}"`;
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: longName }],
      });

      const result = await generateNodeName('Long content');
      expect(result.length).toBeLessThanOrEqual(200);
      expect(result.startsWith('"')).toBe(false);
      expect(result.endsWith('"')).toBe(false);
    });
  });

  describe('chat', () => {
    it('should return text response from anthropic', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Assistant reply' }],
      });

      const result = await chat([{ role: 'user', content: 'Hello' }], 'Context');

      expect(result).toBe('Assistant reply');
      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-20250514',
          messages: [{ role: 'user', content: 'Hello' }],
          system: expect.stringContaining('Context'),
        }),
      );
    });

    it('should return empty string when no text block is present', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'tool_use' }],
      });

      const result = await chat([{ role: 'assistant', content: 'Hi' }], '');
      expect(result).toBe('');
    });
  });

  describe('chatStream', () => {
    it('should yield only text deltas from stream events', async () => {
      async function* makeStream() {
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'Hello' },
        };
        yield { type: 'message_start', delta: { type: 'text_delta', text: '?' } };
        yield {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: ' world' },
        };
      }

      mockAnthropicCreate.mockResolvedValueOnce(makeStream());

      const chunks: string[] = [];
      for await (const chunk of chatStream(
        [{ role: 'user', content: 'Stream this' }],
        '',
      )) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' world']);
      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          stream: true,
        }),
      );
    });
  });
});
