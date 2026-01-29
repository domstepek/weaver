import { useQueryClient } from '@tanstack/react-query';
import { useValue } from '@legendapp/state/react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { chatApi, type Message } from '@/api/client';
import { chatState$, uiState$ } from '@/stores';
import { MessageBubble } from './MessageBubble';

interface ChatPanelProps {
  messages: Message[];
  onPinMessage: (message: Message) => void;
  onNodeClick: (nodeId: string) => void;
}

export function ChatPanel({
  messages,
  onPinMessage,
  onNodeClick,
}: ChatPanelProps) {
  const input = useValue(chatState$.input);
  const conversationId = useValue(uiState$.selectedConversationId);
  const selectedNodeRefs = useValue(uiState$.selectedNodeRefs);
  const useOnlyExplicit = useValue(uiState$.useOnlyExplicit);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(
    null,
  );
  const [streamingMessage, setStreamingMessage] = useState<{
    role: 'assistant';
    content: string;
  } | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Scroll to bottom when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: We want to scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll to bottom when pending user message appears
  useEffect(() => {
    if (pendingUserMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [pendingUserMessage]);

  // Scroll to bottom when streaming message updates
  useEffect(() => {
    if (streamingMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversationId || isStreaming) return;

    const message = input.trim();
    chatState$.input.set('');
    setIsStreaming(true);
    setStreamError(null);
    setPendingUserMessage(message);
    setStreamingMessage({ role: 'assistant', content: '' });

    await chatApi.sendStream(
      {
        conversationId,
        message,
        explicitRefs: selectedNodeRefs,
        useOnlyExplicit,
      },
      {
        onChunk: (text: string) => {
          setStreamingMessage((prev) => ({
            role: 'assistant',
            content: (prev?.content || '') + text,
          }));
        },
        onDone: () => {
          setPendingUserMessage(null);
          setStreamingMessage(null);
          setIsStreaming(false);
          queryClient.invalidateQueries({
            queryKey: ['conversation', conversationId],
          });
          queryClient.invalidateQueries({ queryKey: ['nodes'] });
          queryClient.invalidateQueries({ queryKey: ['node-references'] });
        },
        onError: (error: Error) => {
          setStreamError(error.message);
          setPendingUserMessage(null);
          setStreamingMessage(null);
          setIsStreaming(false);
        },
      },
    );
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No conversation selected</p>
          <p className="text-sm">
            Create or select a conversation to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !pendingUserMessage ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>Start the conversation by sending a message</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onPinClick={onPinMessage}
                onNodeClick={onNodeClick}
              />
            ))}
            {pendingUserMessage && (
              <div className="mb-4 flex justify-end">
                <div className="max-w-[80%] bg-primary-600 text-white rounded-lg px-4 py-3">
                  <div className="whitespace-pre-wrap break-words">
                    {pendingUserMessage}
                  </div>
                </div>
              </div>
            )}
            {streamingMessage && (
              <div className="mb-4 flex justify-start">
                <div className="max-w-[80%] bg-gray-100 text-gray-900 rounded-lg px-4 py-3">
                  <div className="whitespace-pre-wrap break-words">
                    {streamingMessage.content}
                    <span className="inline-block w-2 h-4 ml-1 bg-gray-900 animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Context indicator */}
      {selectedNodeRefs.length > 0 && (
        <div className="px-4 py-2 bg-primary-50 border-t border-primary-100 text-sm text-primary-700">
          {selectedNodeRefs.length} node{selectedNodeRefs.length > 1 ? 's' : ''}{' '}
          selected as context
          {useOnlyExplicit && ' (explicit only)'}
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => chatState$.input.set(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isStreaming ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>

        {streamError && (
          <p className="mt-2 text-sm text-red-600">{streamError}</p>
        )}
      </form>
    </div>
  );
}
