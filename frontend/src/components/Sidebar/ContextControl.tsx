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
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Context Selection
        </h3>
        {selectedRefs.length > 0 && (
          <button
            onClick={clearRefs}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
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
        className="w-full px-2 py-1.5 text-sm border border-border bg-surface-muted text-text-primary rounded-md placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-border-accent"
      />

      {/* Use only explicit toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={useOnlyExplicit}
          onChange={(e) => uiState$.useOnlyExplicit.set(e.target.checked)}
          className="rounded border-border bg-surface-muted text-accent focus:ring-accent"
        />
        <span className="text-sm text-text-secondary">Use only selected nodes</span>
      </label>

      {/* Node list */}
      <div className="max-h-60 overflow-y-auto space-y-1">
        {filteredNodes.length === 0 ? (
          <p className="text-sm text-text-muted italic py-2">
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
                  ${isSelected ? 'bg-surface-selected' : 'hover:bg-surface-muted'}
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleRef(node.id)}
                  className="mt-0.5 rounded border-border bg-surface-muted text-accent focus:ring-accent"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-text-primary block truncate">
                    {displayName}
                  </span>
                  <span className="text-xs text-text-muted block truncate">
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
        <p className="text-xs text-text-accent">
          {selectedRefs.length} node{selectedRefs.length > 1 ? 's' : ''}{' '}
          selected
        </p>
      )}
    </div>
  );
}
