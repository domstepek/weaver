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

vi.mock('../db/index.js', async () => {
  const actual = await vi.importActual('../db/index.js');
  return {
    ...actual,
    db: mockDb,
  };
});

import router from './conversations.js';

describe('conversations routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetQueues();
  });

  it('creates a conversation', async () => {
    const handler = getRouteHandler(router, 'post', '/');
    pushResult('insert', [{ id: 'conv-1', title: 'Roadmap' }]);

    const req = {
      body: { title: 'Roadmap' },
      user: { id: 'user-1' },
    } as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'conv-1', title: 'Roadmap' });
  });

  it('returns validation error for invalid create payload', async () => {
    const handler = getRouteHandler(router, 'post', '/');
    const req = { body: { title: '' }, user: { id: 'user-1' } } as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation error' }),
    );
  });

  it('lists conversations with pagination', async () => {
    const handler = getRouteHandler(router, 'get', '/');
    pushResult('select', [{ id: 'conv-2', title: 'Session' }]);

    const req = {
      query: { limit: '10', offset: '5' },
      user: { id: 'user-1' },
    } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.json).toHaveBeenCalledWith([{ id: 'conv-2', title: 'Session' }]);
  });

  it('returns 404 when conversation is missing', async () => {
    const handler = getRouteHandler(router, 'get', '/:id');
    pushResult('select', []);

    const req = { params: { id: 'conv-missing' }, user: { id: 'user-1' } } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Conversation not found' });
  });

  it('returns conversation with messages', async () => {
    const handler = getRouteHandler(router, 'get', '/:id');
    pushResult('select', [{ id: 'conv-1', title: 'Main' }]);
    pushResult('select', [{ id: 'msg-1', role: 'user', content: 'Hello' }]);

    const req = { params: { id: 'conv-1' }, user: { id: 'user-1' } } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.json).toHaveBeenCalledWith({
      id: 'conv-1',
      title: 'Main',
      messages: [{ id: 'msg-1', role: 'user', content: 'Hello' }],
    });
  });

  it('returns 404 when update target is missing', async () => {
    const handler = getRouteHandler(router, 'patch', '/:id');
    pushResult('update', []);

    const req = {
      params: { id: 'conv-missing' },
      body: { title: 'Updated' },
      user: { id: 'user-1' },
    } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Conversation not found' });
  });

  it('deletes an existing conversation', async () => {
    const handler = getRouteHandler(router, 'delete', '/:id');
    pushResult('delete', [{ id: 'conv-1' }]);

    const req = { params: { id: 'conv-1' }, user: { id: 'user-1' } } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('returns 500 when listing fails unexpectedly', async () => {
    const handler = getRouteHandler(router, 'get', '/');
    pushResult('select', new Error('db failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = { query: {}, user: { id: 'user-1' } } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    consoleSpy.mockRestore();
  });
});
