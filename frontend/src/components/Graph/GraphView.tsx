import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type Node,
  type NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import React, { useCallback, useMemo } from 'react';
import '@xyflow/react/dist/style.css';
import type {
  Node as ApiNode,
  NodeReference,
  NodeWithReferences,
} from '@/api/client';
import { IdeaNode, type IdeaNodeData } from './IdeaNode';

const nodeTypes: NodeTypes = {
  idea: IdeaNode,
};

interface GraphViewProps {
  nodes: ApiNode[];
  references: NodeReference[];
  selectedNode: NodeWithReferences | null;
  onNodeSelect: (nodeId: string) => void;
}

// Simple layout algorithm - position nodes in a grid
function layoutNodes(
  nodeList: ApiNode[],
  references: NodeReference[],
  _selectedNode: NodeWithReferences | null,
) {
  const graphNodes: Node<IdeaNodeData>[] = [];
  const graphEdges: Edge[] = [];

  // Create a set of node IDs to display
  const nodeIds = new Set(nodeList.map((n) => n.id));

  // Position nodes in a grid
  const cols = Math.ceil(Math.sqrt(nodeList.length));
  const spacing = { x: 350, y: 200 };

  nodeList.forEach((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    graphNodes.push({
      id: node.id,
      type: 'idea',
      position: { x: col * spacing.x, y: row * spacing.y },
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
      graphEdges.push({
        id: ref.id,
        source: ref.fromNodeId,
        target: ref.toNodeId,
        animated: ref.referenceType === 'implicit',
        style: {
          stroke: ref.referenceType === 'explicit' ? '#0ea5e9' : '#94a3b8',
        },
      });
    }
  });

  return { nodes: graphNodes, edges: graphEdges };
}

export function GraphView({
  nodes,
  references,
  selectedNode,
  onNodeSelect,
}: GraphViewProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => layoutNodes(nodes, references, selectedNode),
    [nodes, references, selectedNode],
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
      selectedNode,
    );
    setGraphNodes(newNodes);
    setGraphEdges(newEdges);
  }, [nodes, references, selectedNode, setGraphNodes, setGraphEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect],
  );

  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500">
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
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
    </ReactFlow>
  );
}
