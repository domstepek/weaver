import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  authRoutesMock,
  chatRoutesMock,
  conversationsRoutesMock,
  cookieParserMock,
  corsMock,
  expressJsonMock,
  expressMock,
  listenMock,
  nodesRoutesMock,
  useMock,
  getMock,
} = vi.hoisted(() => {
  const use = vi.fn();
  const get = vi.fn();
  const listen = vi.fn((_: unknown, cb?: () => void) => {
    cb?.();
    return {};
  });

  const app = {
    use,
    get,
    listen,
  };

  const expressFn = vi.fn(() => app);
  const json = vi.fn(() => 'json-middleware');
  (expressFn as unknown as { json: typeof json }).json = json;

  return {
    authRoutesMock: { auth: true },
    chatRoutesMock: { chat: true },
    conversationsRoutesMock: { conversations: true },
    cookieParserMock: vi.fn(() => 'cookie-parser-middleware'),
    corsMock: vi.fn(() => 'cors-middleware'),
    expressJsonMock: json,
    expressMock: expressFn,
    getMock: get,
    listenMock: listen,
    nodesRoutesMock: { nodes: true },
    useMock: use,
  };
});

vi.mock('express', () => ({
  default: expressMock,
}));

vi.mock('cors', () => ({
  default: corsMock,
}));

vi.mock('cookie-parser', () => ({
  default: cookieParserMock,
}));

vi.mock('./routes/auth.js', () => ({
  default: authRoutesMock,
}));

vi.mock('./routes/chat.js', () => ({
  default: chatRoutesMock,
}));

vi.mock('./routes/conversations.js', () => ({
  default: conversationsRoutesMock,
}));

vi.mock('./routes/nodes.js', () => ({
  default: nodesRoutesMock,
}));

describe('server bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete process.env.PORT;
    delete process.env.FRONTEND_URL;
  });

  it('registers middleware, routes, and starts server on default port', async () => {
    await import('./index.js');

    expect(corsMock).toHaveBeenCalledWith({
      origin: 'http://localhost:5173',
      credentials: true,
    });
    expect(expressJsonMock).toHaveBeenCalledOnce();
    expect(cookieParserMock).toHaveBeenCalledOnce();
    expect(getMock).toHaveBeenCalledWith('/health', expect.any(Function));

    expect(useMock).toHaveBeenCalledWith('/auth', authRoutesMock);
    expect(useMock).toHaveBeenCalledWith('/api/nodes', nodesRoutesMock);
    expect(useMock).toHaveBeenCalledWith(
      '/api/conversations',
      conversationsRoutesMock,
    );
    expect(useMock).toHaveBeenCalledWith('/api/chat', chatRoutesMock);
    expect(listenMock).toHaveBeenCalledWith(expect.anything(), expect.any(Function));
    expect([3000, '3000']).toContain(listenMock.mock.calls[0][0]);
  });

  it('uses PORT from environment when provided', async () => {
    process.env.PORT = '4567';

    await import('./index.js');

    expect(listenMock).toHaveBeenCalledWith('4567', expect.any(Function));
  });
});
