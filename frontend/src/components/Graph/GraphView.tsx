import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { IdeaNode, IdeaNodeData } from './IdeaNode';
import { NodeWithReferences, Node as ApiNode } from '@/api/client';

const nodeTypes: NodeTypes = {
  idea: IdeaNode,
};

interface GraphViewProps {
  nodes: ApiNode[];
  selectedNode: NodeWithReferences | null;
  onNodeSelect: (nodeId: string) => void;
}

// Simple layout algorithm - position nodes in a grid
function layoutNodes(nodeList: ApiNode[], selectedNode: NodeWithReferences | null) {
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

  // Add edges from selected node if available
  if (selectedNode) {
    // Outgoing references
    selectedNode.outgoingReferences.forEach((ref) => {
      if (nodeIds.has(ref.toNodeId)) {
        graphEdges.push({
          id: `edge-${selectedNode.id}-${ref.toNodeId}`,
          source: selectedNode.id,
          target: ref.toNodeId,
          animated: ref.referenceType === 'implicit',
          style: {
            stroke: ref.referenceType === 'explicit' ? '#0ea5e9' : '#94a3b8',
          },
        });
      }
    });

    // Incoming references
    selectedNode.incomingReferences.forEach((ref) => {
      if (nodeIds.has(ref.fromNodeId)) {
        graphEdges.push({
          id: `edge-${ref.fromNodeId}-${selectedNode.id}`,
          source: ref.fromNodeId,
          target: selectedNode.id,
          animated: ref.referenceType === 'implicit',
          style: {
            stroke: ref.referenceType === 'explicit' ? '#0ea5e9' : '#94a3b8',
          },
        });
      }
    });
  }

  return { nodes: graphNodes, edges: graphEdges };
}

export function GraphView({ nodes, selectedNode, onNodeSelect }: GraphViewProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => layoutNodes(nodes, selectedNode),
    [nodes, selectedNode]
  );

  const [graphNodes, setGraphNodes, onNodesChange] = useNodesState(initialNodes);
  const [graphEdges, setGraphEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when props change
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = layoutNodes(nodes, selectedNode);
    setGraphNodes(newNodes);
    setGraphEdges(newEdges);
  }, [nodes, selectedNode, setGraphNodes, setGraphEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect]
  );

  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No nodes yet</p>
          <p className="text-sm">Send messages and pin them to build your knowledge graph</p>
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
