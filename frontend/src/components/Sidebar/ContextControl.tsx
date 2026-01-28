import { useValue } from '@legendapp/state/react';
import type { Node } from '@/api/client';
import { searchState$, uiState$ } from '@/stores';

interface ContextControlProps {
  nodes: Node[];
}

export function ContextControl({ nodes }: ContextControlProps) {
  const searchQuery = useValue(searchState$.query);
  const selectedRefs = useValue(uiState$.selectedNodeRefs);
  const useOnlyExplicit = useValue(uiState$.useOnlyExplicit);

  const pinnedNodes = nodes.filter((n) => n.isPinned);
  const filteredNodes = searchQuery
    ? nodes.filter(
        (n) =>
          n.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : pinnedNodes;

  const toggleRef = (nodeId: string) => {
    const refs = uiState$.selectedNodeRefs.peek();
    if (refs.includes(nodeId)) {
      uiState$.selectedNodeRefs.set(refs.filter((id) => id !== nodeId));
    } else {
      uiState$.selectedNodeRefs.set([...refs, nodeId]);
    }
  };

  const clearRefs = () => {
    uiState$.selectedNodeRefs.set([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Context Selection
        </h3>
        {selectedRefs.length > 0 && (
          <button
            onClick={clearRefs}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => searchState$.query.set(e.target.value)}
        placeholder="Search nodes..."
        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      {/* Use only explicit toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={useOnlyExplicit}
          onChange={(e) => uiState$.useOnlyExplicit.set(e.target.checked)}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm text-gray-700">Use only selected nodes</span>
      </label>

      {/* Node list */}
      <div className="max-h-60 overflow-y-auto space-y-1">
        {filteredNodes.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-2">
            {searchQuery ? 'No matching nodes' : 'No pinned nodes available'}
          </p>
        ) : (
          filteredNodes.map((node) => {
            const displayName = node.name || `Node-${node.id.slice(0, 8)}`;
            const isSelected = selectedRefs.includes(node.id);

            return (
              <label
                key={node.id}
                className={`
                  flex items-start gap-2 p-2 rounded cursor-pointer transition-colors
                  ${isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'}
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleRef(node.id)}
                  className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 block truncate">
                    {displayName}
                  </span>
                  <span className="text-xs text-gray-500 block truncate">
                    {node.content.slice(0, 60)}
                    {node.content.length > 60 ? '...' : ''}
                  </span>
                </div>
              </label>
            );
          })
        )}
      </div>

      {/* Selected count */}
      {selectedRefs.length > 0 && (
        <p className="text-xs text-primary-600">
          {selectedRefs.length} node{selectedRefs.length > 1 ? 's' : ''}{' '}
          selected
        </p>
      )}
    </div>
  );
}
