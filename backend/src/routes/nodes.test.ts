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
  mockFindSimilarNodes,
  mockGenerateEmbedding,
  mockGenerateNodeName,
} = vi.hoisted(() => ({
  mockFindSimilarNodes: vi.fn(),
  mockGenerateEmbedding: vi.fn(),
  mockGenerateNodeName: vi.fn(),
}));

vi.mock('../db/index.js', async () => {
  const actual = await vi.importActual('../db/index.js');
  return {
    ...actual,
    db: mockDb,
  };
});

vi.mock('../services/ai.js', () => ({
  findSimilarNodes: mockFindSimilarNodes,
  generateEmbedding: mockGenerateEmbedding,
  generateNodeName: mockGenerateNodeName,
}));

import router from './nodes.js';

describe('nodes routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetQueues();
    mockGenerateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    mockGenerateNodeName.mockResolvedValue('Generated name');
    mockFindSimilarNodes.mockResolvedValue([]);
  });

  it('creates a node and auto-generates name when not provided', async () => {
    const handler = getRouteHandler(router, 'post', '/');
    pushResult('insert', [
      {
        id: 'node-1',
        content: 'hello',
        name: 'Generated name',
        isPinned: false,
      },
    ]);

    const req = {
      body: { content: 'hello' },
      user: { id: 'user-1' },
    } as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(mockGenerateEmbedding).toHaveBeenCalledWith('hello');
    expect(mockGenerateNodeName).toHaveBeenCalledWith('hello');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'node-1',
        name: 'Generated name',
      }),
    );
  });

  it('lists nodes with query filters', async () => {
    const handler = getRouteHandler(router, 'get', '/');
    pushResult('select', [{ id: 'node-1', content: 'hello' }]);

    const req = {
      query: { pinned: 'true', search: 'hel', limit: '25', offset: '0' },
      user: { id: 'user-1' },
    } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.json).toHaveBeenCalledWith([{ id: 'node-1', content: 'hello' }]);
  });

  it('returns 404 when node is missing', async () => {
    const handler = getRouteHandler(router, 'get', '/:id');
    pushResult('select', []);

    const req = { params: { id: 'missing-node' }, user: { id: 'user-1' } } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Node not found' });
  });

  it('auto-generates name when pinning an unnamed node', async () => {
    const handler = getRouteHandler(router, 'patch', '/:id');
    pushResult('select', [{ id: 'node-1', name: null, content: 'old content' }]);
    pushResult('update', [{ id: 'node-1', name: 'Pinned title', isPinned: true }]);
    mockGenerateNodeName.mockResolvedValueOnce('Pinned title');

    const req = {
      params: { id: 'node-1' },
      body: { isPinned: true },
      user: { id: 'user-1' },
    } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(mockGenerateNodeName).toHaveBeenCalledWith('old content');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'node-1', name: 'Pinned title', isPinned: true }),
    );
  });

  it('returns 404 when deleting a missing node', async () => {
    const handler = getRouteHandler(router, 'delete', '/:id');
    pushResult('delete', []);

    const req = { params: { id: 'missing-node' }, user: { id: 'user-1' } } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Node not found' });
  });

  it('returns empty related list when node has no embedding', async () => {
    const handler = getRouteHandler(router, 'get', '/:id/related');
    pushResult('select', [{ id: 'node-1', embedding: null }]);

    const req = { params: { id: 'node-1' }, user: { id: 'user-1' } } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.json).toHaveBeenCalledWith([]);
    expect(mockFindSimilarNodes).not.toHaveBeenCalled();
  });

  it('returns validation error for invalid semantic search query', async () => {
    const handler = getRouteHandler(router, 'get', '/search');

    const req = { query: { query: '' }, user: { id: 'user-1' } } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation error' }),
    );
  });

  it('returns all references for current user', async () => {
    const handler = getRouteHandler(router, 'get', '/references/all');
    pushResult('select', [{ id: 'ref-1', fromNodeId: 'n1', toNodeId: 'n2' }]);

    const req = { user: { id: 'user-1' } } as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.json).toHaveBeenCalledWith([
      { id: 'ref-1', fromNodeId: 'n1', toNodeId: 'n2' },
    ]);
  });

  it('returns 500 when create fails unexpectedly', async () => {
    const handler = getRouteHandler(router, 'post', '/');
    pushResult('insert', new Error('insert failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = {
      body: { content: 'hello' },
      user: { id: 'user-1' },
    } as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    consoleSpy.mockRestore();
  });
});
