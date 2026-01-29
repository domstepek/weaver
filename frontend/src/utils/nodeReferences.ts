import React from 'react';

/**
 * Parse and render content with node references as clickable links
 * Matches [NodeName](nodeId) pattern
 */
export function parseNodeReferencesInContent(
  content: string,
  onNodeClick: (nodeId: string) => void,
): (string | React.ReactElement)[] {
  const regex = /\[([^\]]+)\]\(([a-f0-9-]{36})\)/g;
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match = regex.exec(content);

  while (match !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // Add clickable link
    const nodeName = match[1];
    const nodeId = match[2];
    parts.push(
      React.createElement(
        'button',
        {
          type: 'button',
          key: `${nodeId}-${match.index}`,
          onClick: () => onNodeClick(nodeId),
          className: 'text-primary-600 hover:text-primary-800 underline',
        },
        nodeName,
      ),
    );

    lastIndex = match.index + match[0].length;
    match = regex.exec(content);
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

/**
 * Extract node IDs from content
 */
export function extractNodeIds(content: string): string[] {
  const regex = /\[([^\]]+)\]\(([a-f0-9-]{36})\)/g;
  const nodeIds: string[] = [];
  let match = regex.exec(content);

  while (match !== null) {
    nodeIds.push(match[2]);
    match = regex.exec(content);
  }

  return [...new Set(nodeIds)];
}
