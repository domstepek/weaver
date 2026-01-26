import { Handle, type NodeProps, Position } from '@xyflow/react';
import React, { memo } from 'react';

export interface IdeaNodeData {
  id: string;
  content: string;
  name: string | null;
  isPinned: boolean;
  selected?: boolean;
}

export const IdeaNode = memo(({ data, selected }: NodeProps<IdeaNodeData>) => {
  const displayName = data.name || `Node-${data.id.slice(0, 8)}`;
  const truncatedContent =
    data.content.length > 150
      ? data.content.slice(0, 150) + '...'
      : data.content;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400"
      />

      <div
        className={`
          min-w-[200px] max-w-[300px] p-3 rounded-lg shadow-md border-2 transition-all
          ${selected ? 'border-primary-500 shadow-lg' : 'border-gray-200'}
          ${data.isPinned ? 'bg-yellow-50' : 'bg-white'}
        `}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-900 truncate flex-1">
            {displayName}
          </span>
          {data.isPinned && (
            <svg
              className="w-4 h-4 text-yellow-500 flex-shrink-0 ml-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.617 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.018 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.583l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.018 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" />
            </svg>
          )}
        </div>

        <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
          {truncatedContent}
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400"
      />
    </>
  );
});

IdeaNode.displayName = 'IdeaNode';
