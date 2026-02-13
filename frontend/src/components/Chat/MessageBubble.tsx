import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

  // UUID pattern for detecting node references
  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-accent text-accent-contrast shadow-panel'
            : 'bg-surface-muted text-text-primary border border-border shadow-panel'
        }`}
      >
        <div className="message-content break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                // Check if href is a UUID (node reference)
                if (href && UUID_PATTERN.test(href)) {
                  return (
                    <button
                      type="button"
                      onClick={() => onNodeClick(href)}
                      className="text-text-accent hover:text-accent-hover underline cursor-pointer"
                    >
                      {children}
                    </button>
                  );
                }
                // Regular URL link
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-status-info hover:text-accent-hover underline"
                  >
                    {children}
                  </a>
                );
              },
              code: ({ className, children }) => {
                if (!className) {
                  return (
                    <code className="px-1.5 py-0.5 rounded bg-surface-overlay text-text-secondary font-mono text-sm">
                      {children}
                    </code>
                  );
                }
                return (
                  <code
                    className={`block font-mono text-sm ${className || ''}`}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        <div
          className={`mt-2 flex items-center justify-between text-xs ${
            isUser ? 'text-text-inverse' : 'text-text-muted'
          }`}
        >
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          <button
            type="button"
            onClick={() => onPinClick(message)}
            className={`ml-3 hover:opacity-80 transition-opacity ${
              message.isPinned ? 'opacity-100' : 'opacity-50'
            }`}
            title={message.isPinned ? 'Edit pinned node' : 'Pin as node'}
            aria-label={message.isPinned ? 'Edit pinned node' : 'Pin as node'}
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
              role="img"
            >
              <title>
                {message.isPinned ? 'Edit pinned node' : 'Pin as node'}
              </title>
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.617 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.018 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.583l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.018 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
