import { useMutation, useQueryClient } from '@tanstack/react-query';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { chatApi, type Message } from '@/api/client';
import { MessageBubble } from './MessageBubble';

interface ChatPanelProps {
  conversationId: string | null;
  messages: Message[];
  selectedNodeRefs: string[];
  useOnlyExplicit: boolean;
  onPinMessage: (message: Message) => void;
  onNodeClick: (nodeId: string) => void;
}

export function ChatPanel({
  conversationId,
  messages,
  selectedNodeRefs,
  useOnlyExplicit,
  onPinMessage,
  onNodeClick,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const chatMutation = useMutation({
    mutationFn: chatApi.send,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['conversation', conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      queryClient.invalidateQueries({ queryKey: ['node-references'] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversationId || chatMutation.isPending) return;

    const message = input.trim();
    setInput('');

    await chatMutation.mutateAsync({
      conversationId,
      message,
      explicitRefs: selectedNodeRefs,
      useOnlyExplicit,
    });
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
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>Start the conversation by sending a message</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onPinClick={onPinMessage}
              onNodeClick={onNodeClick}
            />
          ))
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
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={chatMutation.isPending}
          />
          <button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {chatMutation.isPending ? (
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

        {chatMutation.error && (
          <p className="mt-2 text-sm text-red-600">
            {chatMutation.error instanceof Error
              ? chatMutation.error.message
              : 'Failed to send message'}
          </p>
        )}
      </form>
    </div>
  );
}
