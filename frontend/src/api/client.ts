// Types
export interface User {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Node {
  id: string;
  content: string;
  name: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NodeReference {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  referenceType: 'explicit' | 'implicit';
  createdAt: string;
}

export interface NodeWithReferences extends Node {
  outgoingReferences: Array<{
    id: string;
    toNodeId: string;
    referenceType: 'explicit' | 'implicit';
    toNodeName: string | null;
    toNodeContent: string;
  }>;
  incomingReferences: Array<{
    id: string;
    fromNodeId: string;
    referenceType: 'explicit' | 'implicit';
    fromNodeName: string | null;
    fromNodeContent: string;
  }>;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  nodeId: string;
  role: 'user' | 'assistant';
  position: number;
  content: string;
  name: string | null;
  isPinned: boolean;
  createdAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ChatResponse {
  userMessage: Node & { role: 'user'; position: number };
  assistantMessage: Node & { role: 'assistant'; position: number };
  contextUsed: Array<{ id: string; name: string | null; content: string }>;
}

// API error class
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Base fetch wrapper
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Only redirect to login if not already there
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      throw new ApiError(401, 'Unauthorized');
    }
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error || 'Unknown error');
  }

  return response.json();
}

// Auth API
export const authApi = {
  getMe: () => apiFetch<{ user: User }>('/auth/me'),
  logout: () =>
    apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST' }),
};

// Nodes API
export const nodesApi = {
  list: (params?: {
    pinned?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.pinned !== undefined)
      searchParams.set('pinned', String(params.pinned));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    return apiFetch<Node[]>(`/api/nodes${query ? `?${query}` : ''}`);
  },

  get: (id: string) => apiFetch<NodeWithReferences>(`/api/nodes/${id}`),

  create: (data: { content: string; name?: string; isPinned?: boolean }) =>
    apiFetch<Node>('/api/nodes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: { content?: string; name?: string | null; isPinned?: boolean },
  ) =>
    apiFetch<Node>(`/api/nodes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/nodes/${id}`, { method: 'DELETE' }),

  getRelated: (id: string) => apiFetch<Node[]>(`/api/nodes/${id}/related`),

  search: (query: string, limit?: number) => {
    const searchParams = new URLSearchParams({ query });
    if (limit) searchParams.set('limit', String(limit));
    return apiFetch<Node[]>(`/api/nodes/search?${searchParams.toString()}`);
  },

  getAllReferences: () => apiFetch<NodeReference[]>('/api/nodes/references/all'),
};

// Conversations API
export const conversationsApi = {
  list: (params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    return apiFetch<Conversation[]>(
      `/api/conversations${query ? `?${query}` : ''}`,
    );
  },

  get: (id: string) =>
    apiFetch<ConversationWithMessages>(`/api/conversations/${id}`),

  create: (data: { title: string }) =>
    apiFetch<Conversation>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { title?: string }) =>
    apiFetch<Conversation>(`/api/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/conversations/${id}`, {
      method: 'DELETE',
    }),
};

// Chat API
export const chatApi = {
  send: (data: {
    conversationId: string;
    message: string;
    explicitRefs?: string[];
    useOnlyExplicit?: boolean;
  }) =>
    apiFetch<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
