import type { Request } from 'express';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
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
  mockCreateAuthorizationURL,
  mockGenerateCodeVerifier,
  mockGenerateState,
  mockValidateAuthorizationCode,
} = vi.hoisted(() => ({
  mockCreateAuthorizationURL: vi.fn(),
  mockGenerateCodeVerifier: vi.fn(),
  mockGenerateState: vi.fn(),
  mockValidateAuthorizationCode: vi.fn(),
}));

vi.mock('arctic', () => {
  class MockGoogle {
    createAuthorizationURL = mockCreateAuthorizationURL;
    validateAuthorizationCode = mockValidateAuthorizationCode;
  }

  return {
    Google: MockGoogle,
  };
});

vi.mock('oslo/oauth2', () => ({
  generateCodeVerifier: mockGenerateCodeVerifier,
  generateState: mockGenerateState,
}));

vi.mock('../db/index.js', async () => {
  const actual = await vi.importActual('../db/index.js');
  return {
    ...actual,
    db: mockDb,
  };
});

import router from './auth.js';

const fetchMock = vi.fn();

describe('auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetQueues();
    vi.stubGlobal('fetch', fetchMock);

    mockGenerateState.mockReturnValue('state-1');
    mockGenerateCodeVerifier.mockReturnValue('verifier-1');
    mockCreateAuthorizationURL.mockReturnValue(new URL('https://accounts.google.com/o/oauth2/v2/auth'));
    mockValidateAuthorizationCode.mockResolvedValue({
      accessToken: () => 'token-1',
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('redirects to Google OAuth and sets verifier cookies', async () => {
    const handler = getRouteHandler(router, 'get', '/google');
    const req = {} as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(mockGenerateState).toHaveBeenCalledOnce();
    expect(mockGenerateCodeVerifier).toHaveBeenCalledOnce();
    expect(res.cookie).toHaveBeenCalledWith(
      'oauth_state',
      'state-1',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'oauth_code_verifier',
      'verifier-1',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.redirect).toHaveBeenCalledWith(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
  });

  it('callback redirects with missing_params when required values are absent', async () => {
    const handler = getRouteHandler(router, 'get', '/google/callback');
    const req = { query: {}, cookies: {} } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.clearCookie).toHaveBeenCalledWith('oauth_state');
    expect(res.clearCookie).toHaveBeenCalledWith('oauth_code_verifier');
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/login?error=missing_params'),
    );
  });

  it('callback redirects with invalid_state when state does not match', async () => {
    const handler = getRouteHandler(router, 'get', '/google/callback');
    const req = {
      query: { code: 'code-1', state: 'state-2' },
      cookies: {
        oauth_state: 'state-1',
        oauth_code_verifier: 'verifier-1',
      },
    } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/login?error=invalid_state'),
    );
  });

  it('callback updates existing user, creates session, and redirects', async () => {
    const handler = getRouteHandler(router, 'get', '/google/callback');

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'google-1',
        email: 'user@example.com',
        name: 'User One',
        picture: 'https://example.com/p.png',
      }),
    });

    pushResult('select', [{ id: 'user-1', googleId: 'google-1' }]);
    pushResult('insert', [{ id: 'session-1' }]);
    pushResult('update', []);

    const req = {
      query: { code: 'code-1', state: 'state-1' },
      cookies: {
        oauth_state: 'state-1',
        oauth_code_verifier: 'verifier-1',
      },
    } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(mockValidateAuthorizationCode).toHaveBeenCalledWith(
      'code-1',
      'verifier-1',
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'session',
      'session-1',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('http'));
  });

  it('callback creates new user when user does not exist', async () => {
    const handler = getRouteHandler(router, 'get', '/google/callback');

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'google-2',
        email: 'new@example.com',
        name: 'New User',
      }),
    });

    pushResult('select', []);
    pushResult('insert', [{ id: 'user-2' }]);
    pushResult('insert', [{ id: 'session-2' }]);

    const req = {
      query: { code: 'code-2', state: 'state-1' },
      cookies: {
        oauth_state: 'state-1',
        oauth_code_verifier: 'verifier-1',
      },
    } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.cookie).toHaveBeenCalledWith(
      'session',
      'session-2',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('http'));
  });

  it('callback redirects with oauth_failed when Google userinfo fetch fails', async () => {
    const handler = getRouteHandler(router, 'get', '/google/callback');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    fetchMock.mockResolvedValueOnce({
      ok: false,
    });

    const req = {
      query: { code: 'code-1', state: 'state-1' },
      cookies: {
        oauth_state: 'state-1',
        oauth_code_verifier: 'verifier-1',
      },
    } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/login?error=oauth_failed'),
    );
    consoleSpy.mockRestore();
  });

  it('logout removes session cookie and returns success', async () => {
    const handler = getRouteHandler(router, 'post', '/logout');
    pushResult('delete', []);

    const req = { cookies: { session: 'session-1' } } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.clearCookie).toHaveBeenCalledWith('session');
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('me returns 401 when session cookie is missing', async () => {
    const handler = getRouteHandler(router, 'get', '/me');
    const req = { cookies: {} } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('me clears invalid session and returns unauthorized', async () => {
    const handler = getRouteHandler(router, 'get', '/me');
    pushResult('select', []);

    const req = { cookies: { session: 'session-1' } } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.clearCookie).toHaveBeenCalledWith('session');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('me returns session expired when session is expired', async () => {
    const handler = getRouteHandler(router, 'get', '/me');

    pushResult('select', [
      {
        user: {
          id: 'user-1',
          email: 'a@example.com',
          name: 'A',
          googleId: 'google-1',
        },
      },
    ]);
    pushResult('select', [{ expiresAt: new Date(Date.now() - 1000) }]);

    const req = { cookies: { session: 'session-1' } } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.clearCookie).toHaveBeenCalledWith('session');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Session expired' });
  });

  it('me returns user without googleId for valid session', async () => {
    const handler = getRouteHandler(router, 'get', '/me');

    pushResult('select', [
      {
        user: {
          id: 'user-1',
          email: 'a@example.com',
          name: 'A',
          googleId: 'google-1',
        },
      },
    ]);
    pushResult('select', [{ expiresAt: new Date(Date.now() + 60_000) }]);

    const req = { cookies: { session: 'session-1' } } as unknown as Request;
    const res = makeResponse();

    await handler(req, res as never, vi.fn());

    expect(res.json).toHaveBeenCalledWith({
      user: {
        id: 'user-1',
        email: 'a@example.com',
        name: 'A',
      },
    });
  });
});
