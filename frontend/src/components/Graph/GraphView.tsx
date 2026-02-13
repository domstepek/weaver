import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MarkerType,
  type Node,
  type NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import React, { useCallback, useMemo } from 'react';
import '@xyflow/react/dist/style.css';
import type { Node as ApiNode, NodeReference } from '@/api/client';
import { IdeaNode, type IdeaNodeData } from './IdeaNode';

const nodeTypes: NodeTypes = {
  idea: IdeaNode,
};

interface GraphViewProps {
  nodes: ApiNode[];
  references: NodeReference[];
  selectedNodeIds: string[];
  onNodeSelect: (nodeId: string) => void;
}

// Simple layout algorithm - position nodes in a grid, sorted chronologically
function layoutNodes(
  nodeList: ApiNode[],
  references: NodeReference[],
  selectedNodeIds: string[],
) {
  const graphNodes: Node<IdeaNodeData>[] = [];
  const graphEdges: Edge[] = [];

  // Create a set of node IDs to display
  const nodeIds = new Set(nodeList.map((n) => n.id));

  // Sort nodes by creation date (oldest first)
  const sortedNodes = [...nodeList].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  // Position nodes vertically in a single column (top to bottom, oldest first)
  const spacing = { y: 250 };

  const selectedNodeIdSet = new Set(selectedNodeIds);

  sortedNodes.forEach((node, index) => {
    graphNodes.push({
      id: node.id,
      type: 'idea',
      position: { x: 0, y: index * spacing.y },
      selected: selectedNodeIdSet.has(node.id),
      data: {
        id: node.id,
        content: node.content,
        name: node.name,
        isPinned: node.isPinned,
      },
    });
  });

  // Add all edges from references
  references.forEach((ref) => {
    // Only add edge if both nodes are in the current node list
    if (nodeIds.has(ref.fromNodeId) && nodeIds.has(ref.toNodeId)) {
      const edgeColor =
        ref.referenceType === 'explicit'
          ? 'var(--color-accent)'
          : 'var(--color-border-strong)';
      graphEdges.push({
        id: ref.id,
        source: ref.fromNodeId,
        target: ref.toNodeId,
        animated: ref.referenceType === 'implicit',
        style: {
          stroke: edgeColor,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        },
      });
    }
  });

  return { nodes: graphNodes, edges: graphEdges };
}

export function GraphView({
  nodes,
  references,
  selectedNodeIds,
  onNodeSelect,
}: GraphViewProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => layoutNodes(nodes, references, selectedNodeIds),
    [nodes, references, selectedNodeIds],
  );

  const [graphNodes, setGraphNodes, onNodesChange] =
    useNodesState(initialNodes);
  const [graphEdges, setGraphEdges, onEdgesChange] =
    useEdgesState(initialEdges);

  // Update nodes when props change
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = layoutNodes(
      nodes,
      references,
      selectedNodeIds,
    );
    setGraphNodes(newNodes);
    setGraphEdges(newEdges);
  }, [nodes, references, selectedNodeIds, setGraphNodes, setGraphEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect],
  );

  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-canvas-muted text-text-muted">
        <div className="text-center">
          <p className="text-lg mb-2">No nodes yet</p>
          <p className="text-sm">
            Send messages and pin them to build your knowledge graph
          </p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={graphNodes}
      edges={graphEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.1}
      maxZoom={2}
    >
      <Controls />
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="var(--color-border-subtle)"
      />
    </ReactFlow>
  );
}
