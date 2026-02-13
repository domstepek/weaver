import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Node as ApiNode, NodeReference } from '@/api/client';
import { GraphView } from './GraphView';

const {
  setGraphEdges,
  setGraphNodes,
  onEdgesChange,
  onNodesChange,
  useEdgesStateMock,
  useNodesStateMock,
} = vi.hoisted(() => ({
  setGraphNodes: vi.fn(),
  setGraphEdges: vi.fn(),
  onNodesChange: vi.fn(),
  onEdgesChange: vi.fn(),
  useNodesStateMock: vi.fn(),
  useEdgesStateMock: vi.fn(),
}));

vi.mock('@xyflow/react', () => {
  useNodesStateMock.mockImplementation((initialNodes: unknown[]) => [
    initialNodes,
    setGraphNodes,
    onNodesChange,
  ]);
  useEdgesStateMock.mockImplementation((initialEdges: unknown[]) => [
    initialEdges,
    setGraphEdges,
    onEdgesChange,
  ]);

  return {
    Background: () => <div data-testid="graph-background" />,
    BackgroundVariant: { Dots: 'dots' },
    Controls: () => <div data-testid="graph-controls" />,
    MarkerType: { ArrowClosed: 'arrowclosed' },
    ReactFlow: ({
      children,
      onNodeClick,
    }: {
      children: unknown;
      onNodeClick?: (event: unknown, node: { id: string }) => void;
    }) => (
      <div data-testid="react-flow">
        <button
          type="button"
          onClick={() =>
            onNodeClick?.({}, { id: '22222222-2222-2222-2222-222222222222' })
          }
        >
          Click node
        </button>
        {children}
      </div>
    ),
    useEdgesState: useEdgesStateMock,
    useNodesState: useNodesStateMock,
  };
});

describe('GraphView', () => {
  beforeEach(() => {
    setGraphNodes.mockClear();
    setGraphEdges.mockClear();
    onNodesChange.mockClear();
    onEdgesChange.mockClear();
    useNodesStateMock.mockClear();
    useEdgesStateMock.mockClear();
  });

  const nodes: ApiNode[] = [
    {
      id: '22222222-2222-2222-2222-222222222222',
      content: 'Second',
      name: 'Second',
      isPinned: false,
      createdAt: '2026-02-06T10:05:00.000Z',
      updatedAt: '',
    },
    {
      id: '11111111-1111-1111-1111-111111111111',
      content: 'First',
      name: 'First',
      isPinned: true,
      createdAt: '2026-02-06T10:00:00.000Z',
      updatedAt: '',
    },
  ];

  const references: NodeReference[] = [
    {
      id: 'edge-explicit',
      fromNodeId: '11111111-1111-1111-1111-111111111111',
      toNodeId: '22222222-2222-2222-2222-222222222222',
      referenceType: 'explicit',
      createdAt: '',
    },
    {
      id: 'edge-implicit',
      fromNodeId: '22222222-2222-2222-2222-222222222222',
      toNodeId: '11111111-1111-1111-1111-111111111111',
      referenceType: 'implicit',
      createdAt: '',
    },
    {
      id: 'edge-ignored',
      fromNodeId: 'does-not-exist',
      toNodeId: '11111111-1111-1111-1111-111111111111',
      referenceType: 'explicit',
      createdAt: '',
    },
  ];

  it('renders empty state when there are no nodes', () => {
    render(
      <GraphView
        nodes={[]}
        references={[]}
        selectedNodeIds={[]}
        onNodeSelect={() => {}}
      />,
    );

    expect(screen.getByText('No nodes yet')).toBeInTheDocument();
  });

  it('lays out nodes and edges and triggers node selection callback', () => {
    const onNodeSelect = vi.fn();

    render(
      <GraphView
        nodes={nodes}
        references={references}
        selectedNodeIds={['11111111-1111-1111-1111-111111111111']}
        onNodeSelect={onNodeSelect}
      />,
    );

    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    expect(screen.getByTestId('graph-controls')).toBeInTheDocument();
    expect(screen.getByTestId('graph-background')).toBeInTheDocument();

    const initialNodesArg = useNodesStateMock.mock.calls.at(-1)?.[0] as Array<{
      id: string;
      position: { x: number; y: number };
      selected?: boolean;
    }>;

    expect(initialNodesArg.map((n) => n.id)).toEqual([
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
    ]);
    expect(initialNodesArg[0].position).toEqual({ x: 0, y: 0 });
    expect(initialNodesArg[1].position).toEqual({ x: 0, y: 250 });
    expect(initialNodesArg[0].selected).toBe(true);

    const initialEdgesArg = useEdgesStateMock.mock.calls.at(-1)?.[0] as Array<{
      id: string;
      animated: boolean;
      style: { stroke: string };
      markerEnd: { color: string };
    }>;

    expect(initialEdgesArg).toHaveLength(2);
    expect(initialEdgesArg.find((e) => e.id === 'edge-explicit')).toMatchObject({
      animated: false,
      style: { stroke: 'var(--color-accent)' },
      markerEnd: { color: 'var(--color-accent)' },
    });
    expect(initialEdgesArg.find((e) => e.id === 'edge-implicit')).toMatchObject({
      animated: true,
      style: { stroke: 'var(--color-border-strong)' },
      markerEnd: { color: 'var(--color-border-strong)' },
    });

    expect(setGraphNodes).toHaveBeenCalled();
    expect(setGraphEdges).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Click node' }));
    expect(onNodeSelect).toHaveBeenCalledWith('22222222-2222-2222-2222-222222222222');
  });
});
