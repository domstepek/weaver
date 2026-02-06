import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  authApi,
  chatApi,
  conversationsApi,
  nodesApi,
} from './client';

interface MockResponseOptions {
  ok: boolean;
  status?: number;
  json?: unknown;
  jsonThrows?: boolean;
  body?: { getReader: () => { read: () => Promise<{ done: boolean; value?: Uint8Array }> } };
}

function createMockResponse(options: MockResponseOptions): Response {
  return {
    ok: options.ok,
    status: options.status ?? (options.ok ? 200 : 500),
    json: options.jsonThrows
      ? async () => {
          throw new Error('invalid json');
        }
      : async () => options.json,
    body: options.body as Response['body'],
  } as Response;
}

describe('api/client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('builds and calls node and conversation endpoints with expected options', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      createMockResponse({ ok: true, json: { success: true } }),
    );

    await authApi.getMe();
    await authApi.logout();

    await nodesApi.list({ pinned: true, search: 'alpha', limit: 10, offset: 5 });
    await nodesApi.get('node-1');
    await nodesApi.create({ content: 'hello', isPinned: true });
    await nodesApi.update('node-1', { name: 'Updated' });
    await nodesApi.delete('node-1');
    await nodesApi.getRelated('node-1');
    await nodesApi.search('term', 7);
    await nodesApi.getAllReferences();

    await conversationsApi.list({ limit: 5, offset: 2 });
    await conversationsApi.get('conv-1');
    await conversationsApi.create({ title: 'Conversation 1' });
    await conversationsApi.update('conv-1', { title: 'Renamed' });
    await conversationsApi.delete('conv-1');

    await chatApi.send({
      conversationId: 'conv-1',
      message: 'hi',
      explicitRefs: ['node-1'],
      useOnlyExplicit: true,
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('/auth/me', expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith('/auth/logout', expect.objectContaining({ method: 'POST' }));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/nodes?pinned=true&search=alpha&limit=10&offset=5',
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(fetchMock).toHaveBeenCalledWith('/api/nodes/node-1', expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith('/api/nodes', expect.objectContaining({ method: 'POST' }));
    expect(fetchMock).toHaveBeenCalledWith('/api/nodes/node-1', expect.objectContaining({ method: 'PATCH' }));
    expect(fetchMock).toHaveBeenCalledWith('/api/nodes/node-1', expect.objectContaining({ method: 'DELETE' }));
    expect(fetchMock).toHaveBeenCalledWith('/api/nodes/node-1/related', expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith('/api/nodes/search?query=term&limit=7', expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith('/api/nodes/references/all', expect.any(Object));

    expect(fetchMock).toHaveBeenCalledWith('/api/conversations?limit=5&offset=2', expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith('/api/conversations/conv-1', expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith('/api/conversations', expect.objectContaining({ method: 'POST' }));
    expect(fetchMock).toHaveBeenCalledWith('/api/conversations/conv-1', expect.objectContaining({ method: 'PATCH' }));
    expect(fetchMock).toHaveBeenCalledWith('/api/conversations/conv-1', expect.objectContaining({ method: 'DELETE' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ method: 'POST' }));
  });

  it('throws ApiError for unauthorized requests and redirects when not on login', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(createMockResponse({ ok: false, status: 401, json: {} }));

    window.history.replaceState({}, '', '/app');

    await expect(authApi.getMe()).rejects.toBeInstanceOf(ApiError);
    expect(window.location.pathname).toBe('/login');
  });

  it('throws ApiError for unauthorized requests without redirecting when already on login', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(createMockResponse({ ok: false, status: 401, json: {} }));

    window.history.replaceState({}, '', '/login');

    await expect(authApi.getMe()).rejects.toMatchObject({ status: 401, message: 'Unauthorized' });
    expect(window.location.pathname).toBe('/login');
  });

  it('surfaces API error messages and fallback unknown errors', async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce(
      createMockResponse({ ok: false, status: 400, json: { error: 'Bad request' } }),
    );

    await expect(nodesApi.list()).rejects.toMatchObject({
      status: 400,
      message: 'Bad request',
    });

    fetchMock.mockResolvedValueOnce(
      createMockResponse({ ok: false, status: 500, jsonThrows: true }),
    );

    await expect(nodesApi.list()).rejects.toMatchObject({
      status: 500,
      message: 'Unknown error',
    });
  });

  it('streams chat responses and routes chunk/done callbacks', async () => {
    const fetchMock = vi.mocked(fetch);
    const encoder = new TextEncoder();

    const streamLines = [
      'data: {"type":"chunk","text":"hello"}\n',
      'data: {"type":"chunk","text":" world"}\n',
      'data: {"type":"done","userMessage":{"id":"u1"},"assistantMessage":{"id":"a1"},"contextUsed":[]}\n',
    ];

    let readIndex = 0;

    fetchMock.mockResolvedValue(
      createMockResponse({
        ok: true,
        body: {
          getReader: () => ({
            read: async () => {
              if (readIndex >= streamLines.length) {
                return { done: true };
              }

              const chunk = encoder.encode(streamLines[readIndex]);
              readIndex += 1;
              return { done: false, value: chunk };
            },
          }),
        },
      }),
    );

    const onChunk = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await chatApi.sendStream(
      { conversationId: 'conv-1', message: 'Hi' },
      { onChunk, onDone, onError },
    );

    expect(onChunk).toHaveBeenNthCalledWith(1, 'hello');
    expect(onChunk).toHaveBeenNthCalledWith(2, ' world');
    expect(onDone).toHaveBeenCalledWith({
      userMessage: { id: 'u1' },
      assistantMessage: { id: 'a1' },
      contextUsed: [],
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('handles stream parse errors, stream error events, unreadable bodies, and thrown errors', async () => {
    const fetchMock = vi.mocked(fetch);
    const encoder = new TextEncoder();
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    let readIndex = 0;
    const lines = [
      'data: not-json\n',
      'data: {"type":"error","message":"stream failed"}\n',
    ];

    fetchMock.mockResolvedValueOnce(
      createMockResponse({
        ok: true,
        body: {
          getReader: () => ({
            read: async () => {
              if (readIndex >= lines.length) {
                return { done: true };
              }

              const chunk = encoder.encode(lines[readIndex]);
              readIndex += 1;
              return { done: false, value: chunk };
            },
          }),
        },
      }),
    );

    const onError = vi.fn();

    await chatApi.sendStream(
      { conversationId: 'conv-1', message: 'Hi' },
      { onChunk: vi.fn(), onDone: vi.fn(), onError },
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'stream failed' }));

    fetchMock.mockResolvedValueOnce(createMockResponse({ ok: true }));

    await chatApi.sendStream(
      { conversationId: 'conv-1', message: 'Hi' },
      { onChunk: vi.fn(), onDone: vi.fn(), onError },
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Response body is not readable' }),
    );

    fetchMock.mockRejectedValueOnce('network');

    await chatApi.sendStream(
      { conversationId: 'conv-1', message: 'Hi' },
      { onChunk: vi.fn(), onDone: vi.fn(), onError },
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Unknown streaming error' }),
    );
  });

  it('handles stream unauthorized and stream non-401 error cases', async () => {
    const fetchMock = vi.mocked(fetch);

    window.history.replaceState({}, '', '/app');
    fetchMock.mockResolvedValueOnce(
      createMockResponse({ ok: false, status: 401, json: {} }),
    );

    const onError = vi.fn();

    await chatApi.sendStream(
      { conversationId: 'conv-1', message: 'Hi' },
      { onChunk: vi.fn(), onDone: vi.fn(), onError },
    );

    expect(window.location.pathname).toBe('/login');
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Unauthorized' }),
    );

    fetchMock.mockResolvedValueOnce(
      createMockResponse({ ok: false, status: 500, json: { error: 'boom' } }),
    );

    await chatApi.sendStream(
      { conversationId: 'conv-1', message: 'Hi' },
      { onChunk: vi.fn(), onDone: vi.fn(), onError },
    );

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
  });
});
