import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { enqueueSelectResult, mockDbSelect, resetSelectQueue } = vi.hoisted(
  () => {
    const selectQueue: unknown[] = [];

    const makeBuilder = (result: unknown) => {
      const builder = (result instanceof Error
        ? Promise.reject(result)
        : Promise.resolve(result)) as Promise<unknown> & {
        from: ReturnType<typeof vi.fn>;
        innerJoin: ReturnType<typeof vi.fn>;
        where: ReturnType<typeof vi.fn>;
        limit: ReturnType<typeof vi.fn>;
      };
      builder.from = vi.fn(() => builder);
      builder.innerJoin = vi.fn(() => builder);
      builder.where = vi.fn(() => builder);
      builder.limit = vi.fn(() => builder);

      return builder;
    };

    return {
      enqueueSelectResult: (result: unknown) => {
        selectQueue.push(result);
      },
      resetSelectQueue: () => {
        selectQueue.length = 0;
      },
      mockDbSelect: vi.fn(() => {
        const nextResult = selectQueue.length > 0 ? selectQueue.shift() : [];
        return makeBuilder(nextResult);
      }),
    };
  },
);

vi.mock('../db/index.js', async () => {
  const actual = await vi.importActual('../db/index.js');
  return {
    ...actual,
    db: {
      select: mockDbSelect,
    },
  };
});

import { optionalAuth, requireAuth } from './auth.js';

function makeResponse() {
  const response: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return response as Response;
}

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSelectQueue();
  });

  it('returns 401 when session cookie is missing in requireAuth', async () => {
    const req = { cookies: {} } as Request;
    const res = makeResponse();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.user and calls next when session is valid in requireAuth', async () => {
    const user = { id: 'user-1', email: 'a@example.com' };
    enqueueSelectResult([{ session: { id: 's1' }, user }]);

    const req = { cookies: { session: 's1' } } as Request;
    const res = makeResponse();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual(user);
    expect(req.sessionId).toBe('s1');
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when no active session row exists in requireAuth', async () => {
    enqueueSelectResult([]);

    const req = { cookies: { session: 's1' } } as Request;
    const res = makeResponse();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 when db query fails in requireAuth', async () => {
    enqueueSelectResult(new Error('db down'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = { cookies: { session: 's1' } } as Request;
    const res = makeResponse();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    expect(next).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('optionalAuth calls next without querying when session is missing', async () => {
    const req = { cookies: {} } as Request;
    const res = makeResponse();
    const next = vi.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(mockDbSelect).not.toHaveBeenCalled();
  });

  it('optionalAuth sets user/session when session is valid', async () => {
    const user = { id: 'user-2' };
    enqueueSelectResult([{ session: { id: 's2' }, user }]);

    const req = { cookies: { session: 's2' } } as Request;
    const res = makeResponse();
    const next = vi.fn();

    optionalAuth(req, res, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalledOnce());

    expect(req.user).toEqual(user);
    expect(req.sessionId).toBe('s2');
  });

  it('optionalAuth swallows errors and still calls next', async () => {
    enqueueSelectResult(new Error('query failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = { cookies: { session: 's3' } } as Request;
    const res = makeResponse();
    const next = vi.fn();

    optionalAuth(req, res, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalledOnce());

    expect(req.user).toBeUndefined();
    consoleSpy.mockRestore();
  });
});
