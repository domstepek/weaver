import type React from 'react';
import type { Message } from '@/api/client';

interface MessageBubbleProps {
  message: Message;
  onPinClick: (message: Message) => void;
  onNodeClick: (nodeId: string) => void;
}

export function MessageBubble({
  message,
  onPinClick,
  onNodeClick,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Parse and render content with node references as clickable links
  const renderContent = (content: string) => {
    // Match [NodeName](nodeId) pattern
    const regex = /\[([^\]]+)\]\(([a-f0-9-]{36})\)/g;
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      // Add clickable link
      const nodeName = match[1];
      const nodeId = match[2];
      parts.push(
        <button
          key={`${nodeId}-${match.index}`}
          onClick={() => onNodeClick(nodeId)}
          className="text-primary-600 hover:text-primary-800 underline"
        >
          {nodeName}
        </button>,
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div className="message-content whitespace-pre-wrap break-words">
          {renderContent(message.content)}
        </div>

        <div
          className={`mt-2 flex items-center justify-between text-xs ${
            isUser ? 'text-primary-200' : 'text-gray-500'
          }`}
        >
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          <button
            onClick={() => onPinClick(message)}
            className={`ml-3 hover:opacity-80 transition-opacity ${
              message.isPinned ? 'opacity-100' : 'opacity-50'
            }`}
            title={message.isPinned ? 'Edit pinned node' : 'Pin as node'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.617 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.018 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.583l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.018 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
