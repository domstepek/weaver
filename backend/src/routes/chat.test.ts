import type { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRouteHandler, makeResponse } from '../test/routerTestUtils.js';

const { mockDb, pushResult, resetQueues } = vi.hoisted(() => {
  const queues = {
    select: [] as unknown[],
    insert: [] as unknown[],
    update: [] as unknown[],
    delete: [] as unknown[],
  };

  const nextResult = (op: keyof typeof queues) =>
    queues[op].length > 0 ? queues[op].shift() : [];

  const makeBuilder = (result: unknown) => {
    const builder = (result instanceof Error
      ? Promise.reject(result)
      : Promise.resolve(result)) as Promise<unknown> &
      Record<string, ReturnType<typeof vi.fn>>;

    for (const method of [
      'from',
      'innerJoin',
      'where',
      'orderBy',
      'limit',
      'offset',
      'values',
      'set',
      'returning',
    ]) {
      builder[method] = vi.fn(() => builder);
    }

    return builder;
  };

  const db = {
    select: vi.fn(() => makeBuilder(nextResult('select'))),
    insert: vi.fn(() => makeBuilder(nextResult('insert'))),
    update: vi.fn(() => makeBuilder(nextResult('update'))),
    delete: vi.fn(() => makeBuilder(nextResult('delete'))),
  };

  return {
    mockDb: db,
    pushResult: (operation: keyof typeof queues, result: unknown) => {
      queues[operation].push(result);
    },
    resetQueues: () => {
      queues.select.length = 0;
      queues.insert.length = 0;
      queues.update.length = 0;
      queues.delete.length = 0;
    },
  };
});

const {
  mockChatStream,
  mockFindSimilarNodes,
  mockFormatNodesAsContext,
  mockGenerateEmbedding,
  mockGenerateNodeName,
  mockParseNodeReferences,
} = vi.hoisted(() => ({
  mockChatStream: vi.fn(),
  mockFindSimilarNodes: vi.fn(),
  mockFormatNodesAsContext: vi.fn(),
  mockGenerateEmbedding: vi.fn(),
  mockGenerateNodeName: vi.fn(),
  mockParseNodeReferences: vi.fn(),
}));

vi.mock('../db/index.js', async () => {
  const actual = await vi.importActual('../db/index.js');
  return {
    ...actual,
    db: mockDb,
  };
});

vi.mock('../services/ai.js', () => ({
  chatStream: mockChatStream,
  findSimilarNodes: mockFindSimilarNodes,
  formatNodesAsContext: mockFormatNodesAsContext,
  generateEmbedding: mockGenerateEmbedding,
  generateNodeName: mockGenerateNodeName,
  parseNodeReferences: mockParseNodeReferences,
}));

import router from './chat.js';

const CONVERSATION_ID = '12345678-1234-1234-1234-123456789abc';
const USER_NODE_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const AI_NODE_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const EXPLICIT_NODE_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

describe('chat routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetQueues();

    mockGenerateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    mockGenerateNodeName.mockResolvedValue('Generated');
    mockFindSimilarNodes.mockResolvedValue([]);
    mockFormatNodesAsContext.mockReturnValue('context');
    mockParseNodeReferences.mockReturnValue([]);
  });

  it('returns validation error for invalid request body', async () => {
    const handler = getRouteHandler(router, 'post', '/');
    const req = {
      body: { conversationId: 'not-a-uuid', message: '' },
      user: { id: 'user-1' },
    } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation error' }),
    );
  });

  it('returns 404 when conversation does not exist', async () => {
    const handler = getRouteHandler(router, 'post', '/');
    pushResult('select', []);

    const req = {
      body: { conversationId: CONVERSATION_ID, message: 'hello' },
      user: { id: 'user-1' },
    } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Conversation not found' });
  });

  it('streams chunks and sends done payload on success', async () => {
    const handler = getRouteHandler(router, 'post', '/');

    pushResult('select', [{ id: CONVERSATION_ID, userId: 'user-1' }]);
    pushResult('select', [
      {
        nodeId: EXPLICIT_NODE_ID,
        role: 'assistant',
        content: 'Previous context',
        position: 0,
      },
    ]);
    pushResult('select', [
      {
        id: EXPLICIT_NODE_ID,
        name: 'Explicit',
        content: 'Explicit content',
      },
    ]);
    pushResult('select', [{ id: EXPLICIT_NODE_ID }]);

    const now = new Date();
    pushResult('insert', [
      {
        id: USER_NODE_ID,
        userId: 'user-1',
        content: 'hello',
        name: 'User message',
        embedding: [0.1],
        isPinned: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    pushResult('insert', []);
    pushResult('insert', [
      {
        id: AI_NODE_ID,
        userId: 'user-1',
        content: 'Hello there',
        name: 'Assistant message',
        embedding: [0.2],
        isPinned: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    pushResult('insert', []);
    pushResult('insert', []);
    pushResult('insert', []);
    pushResult('insert', []);
    pushResult('update', []);

    mockFindSimilarNodes.mockResolvedValueOnce([
      { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', content: 'Similar' },
    ]);
    mockParseNodeReferences.mockReturnValueOnce([EXPLICIT_NODE_ID]);

    mockChatStream.mockImplementationOnce(async function* () {
      yield 'Hello';
      yield ' there';
    });

    const req = {
      body: {
        conversationId: CONVERSATION_ID,
        message: 'hello',
        explicitRefs: [EXPLICIT_NODE_ID],
      },
      user: { id: 'user-1' },
    } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    expect(res.write).toHaveBeenCalledWith(
      expect.stringContaining('"type":"chunk"'),
    );
    expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"type":"done"'));
    expect(res.end).toHaveBeenCalledOnce();
  });

  it('returns stream error event when chat stream fails', async () => {
    const handler = getRouteHandler(router, 'post', '/');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    pushResult('select', [{ id: CONVERSATION_ID, userId: 'user-1' }]);
    pushResult('select', []);

    const now = new Date();
    pushResult('insert', [
      {
        id: USER_NODE_ID,
        userId: 'user-1',
        content: 'hello',
        name: 'User message',
        embedding: [0.1],
        isPinned: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    pushResult('insert', []);

    mockChatStream.mockImplementationOnce(async function* () {
      yield 'partial';
      throw new Error('stream failed');
    });

    const req = {
      body: {
        conversationId: CONVERSATION_ID,
        message: 'hello',
      },
      user: { id: 'user-1' },
    } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"type":"error"'));
    expect(res.end).toHaveBeenCalledOnce();

    consoleSpy.mockRestore();
  });
});
