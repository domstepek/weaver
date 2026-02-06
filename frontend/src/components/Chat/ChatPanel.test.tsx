import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Message, Node } from '@/api/client';
import { chatState$, uiState$ } from '@/stores';
import { ChatPanel } from './ChatPanel';

const mockSendStream = vi.fn();

vi.mock('@/api/client', async (importActual) => {
  const actual = await importActual<typeof import('@/api/client')>();
  return {
    ...actual,
    chatApi: {
      sendStream: (...args: unknown[]) => mockSendStream(...args),
    },
  };
});

vi.mock('./MessageBubble', () => ({
  MessageBubble: ({ message }: { message: Message }) => (
    <div data-testid="message-bubble">{message.content}</div>
  ),
}));

const baseMessage: Message = {
  id: 'm1',
  nodeId: 'n1',
  role: 'assistant',
  position: 1,
  content: 'existing message',
  name: null,
  isPinned: false,
  createdAt: new Date().toISOString(),
};

const contextNodes: Node[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    content: 'Alpha content',
    name: 'Alpha',
    isPinned: true,
    createdAt: '',
    updatedAt: '',
  },
];

function renderWithClient(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
}

describe('ChatPanel', () => {
  beforeEach(() => {
    mockSendStream.mockReset();
    chatState$.input.set('');
    uiState$.selectedConversationId.set(null);
    uiState$.selectedNodeRefs.set([]);
    uiState$.useOnlyExplicit.set(false);
  });

  it('renders empty state when no conversation is selected', () => {
    renderWithClient(
      <ChatPanel
        messages={[]}
        nodes={[]}
        onPinMessage={() => {}}
        onNodeClick={() => {}}
      />,
    );

    expect(screen.getByText('No conversation selected')).toBeInTheDocument();
  });

  it('handles streaming submit success and invalidates conversation, nodes, and references', async () => {
    uiState$.selectedConversationId.set('conv-1');
    uiState$.selectedNodeRefs.set(['11111111-1111-1111-1111-111111111111']);
    uiState$.useOnlyExplicit.set(true);
    chatState$.input.set('Hello from test');

    mockSendStream.mockImplementation(
      async (
        data: {
          conversationId: string;
          message: string;
          explicitRefs?: string[];
          useOnlyExplicit?: boolean;
        },
        callbacks: {
          onChunk: (text: string) => void;
          onDone: () => void;
          onError: (error: Error) => void;
        },
      ) => {
        expect(data).toEqual({
          conversationId: 'conv-1',
          message: 'Hello from test',
          explicitRefs: ['11111111-1111-1111-1111-111111111111'],
          useOnlyExplicit: true,
        });
        callbacks.onChunk('stream ');
        callbacks.onChunk('output');
        callbacks.onDone();
      },
    );

    const { queryClient } = renderWithClient(
      <ChatPanel
        messages={[baseMessage]}
        nodes={contextNodes}
        onPinMessage={() => {}}
        onNodeClick={() => {}}
      />,
    );

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(mockSendStream).toHaveBeenCalledTimes(1);
    });

    expect(chatState$.input.peek()).toBe('');

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['conversation', 'conv-1'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['nodes'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['node-references'] });
    });
  });

  it('shows stream error and allows removing context badges', async () => {
    uiState$.selectedConversationId.set('conv-2');
    uiState$.selectedNodeRefs.set(['11111111-1111-1111-1111-111111111111']);
    uiState$.useOnlyExplicit.set(true);
    chatState$.input.set('trigger error');

    mockSendStream.mockImplementation(
      async (
        _data: unknown,
        callbacks: {
          onChunk: (text: string) => void;
          onDone: () => void;
          onError: (error: Error) => void;
        },
      ) => {
        callbacks.onError(new Error('stream failed'));
      },
    );

    renderWithClient(
      <ChatPanel
        messages={[]}
        nodes={contextNodes}
        onPinMessage={() => {}}
        onNodeClick={() => {}}
      />,
    );

    expect(screen.getByText('Explicit only')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Alpha from context' }),
    );

    expect(uiState$.selectedNodeRefs.peek()).toEqual([]);

    chatState$.input.set('trigger error');
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByText('stream failed')).toBeInTheDocument();
    });
  });

  it('shows starter prompt when conversation has no messages', () => {
    uiState$.selectedConversationId.set('conv-3');

    renderWithClient(
      <ChatPanel
        messages={[]}
        nodes={[]}
        onPinMessage={() => {}}
        onNodeClick={() => {}}
      />,
    );

    expect(
      screen.getByText('Start the conversation by sending a message'),
    ).toBeInTheDocument();
  });
});
