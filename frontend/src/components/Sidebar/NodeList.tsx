import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Node } from '@/api/client';

interface NodeListProps {
  nodes: Node[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string) => void;
  onNodeDelete: (nodeId: string) => void;
}

export function NodeList({
  nodes,
  selectedNodeId,
  onNodeSelect,
  onNodeDelete,
}: NodeListProps) {
  const pinnedNodes = nodes.filter((n) => n.isPinned);
  const recentNodes = nodes.filter((n) => !n.isPinned).slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Pinned nodes */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Pinned Nodes
        </h3>
        {pinnedNodes.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No pinned nodes</p>
        ) : (
          <ul className="space-y-1">
            {pinnedNodes.map((node) => (
              <NodeListItem
                key={node.id}
                node={node}
                isSelected={node.id === selectedNodeId}
                onClick={() => onNodeSelect(node.id)}
                onDelete={() => onNodeDelete(node.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Recent nodes */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Recent
        </h3>
        {recentNodes.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No recent nodes</p>
        ) : (
          <ul className="space-y-1">
            {recentNodes.map((node) => (
              <NodeListItem
                key={node.id}
                node={node}
                isSelected={node.id === selectedNodeId}
                onClick={() => onNodeSelect(node.id)}
                onDelete={() => onNodeDelete(node.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface NodeListItemProps {
  node: Node;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function NodeListItem({
  node,
  isSelected,
  onClick,
  onDelete,
}: NodeListItemProps) {
  const displayName = node.name || `Node-${node.id.slice(0, 8)}`;
  const truncatedContent =
    node.content.length > 50 ? `${node.content.slice(0, 50)}...` : node.content;

  return (
    <li
      className={`
        group px-2 py-1.5 rounded cursor-pointer transition-colors
        ${isSelected ? 'bg-primary-100 text-primary-900' : 'hover:bg-gray-100'}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate flex-1">
          {displayName}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
          title="Delete node"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="text-xs text-gray-500 truncate node-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <span className="inline">{children}</span>,
            code: ({ children }) => (
              <code className="px-1 py-0.5 rounded bg-gray-200 text-gray-900 font-mono text-xs">
                {children}
              </code>
            ),
            strong: ({ children }) => <strong>{children}</strong>,
            em: ({ children }) => <em>{children}</em>,
          }}
        >
          {truncatedContent}
        </ReactMarkdown>
      </div>
    </li>
  );
}
