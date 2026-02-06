import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Node } from '@/api/client';
import { NodeList } from './NodeList';

const nodes: Node[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    content: 'Pinned node **markdown**',
    name: 'PinnedNode',
    isPinned: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    content: 'Recent node with `inline code` and long content '.repeat(3),
    name: null,
    isPinned: false,
    createdAt: '',
    updatedAt: '',
  },
];

describe('NodeList', () => {
  it('shows empty states', () => {
    render(
      <NodeList
        nodes={[]}
        selectedNodeIds={[]}
        onNodeSelect={() => {}}
        onNodeDelete={() => {}}
      />,
    );

    expect(screen.getByText('No pinned nodes')).toBeInTheDocument();
    expect(screen.getByText('No recent nodes')).toBeInTheDocument();
  });

  it('renders pinned and recent nodes and handles select/delete', () => {
    const onNodeSelect = vi.fn();
    const onNodeDelete = vi.fn();

    render(
      <NodeList
        nodes={nodes}
        selectedNodeIds={['11111111-1111-1111-1111-111111111111']}
        onNodeSelect={onNodeSelect}
        onNodeDelete={onNodeDelete}
      />,
    );

    expect(screen.getByText('PinnedNode')).toBeInTheDocument();
    expect(screen.getByText(/Node-22222222/)).toBeInTheDocument();

    const listItems = screen.getAllByRole('listitem');
    fireEvent.click(listItems[0]);
    expect(onNodeSelect).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');

    const deleteButtons = screen.getAllByTitle('Delete node');
    fireEvent.click(deleteButtons[0]);
    expect(onNodeDelete).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
  });

  it('renders truncated recent content', () => {
    render(
      <NodeList
        nodes={nodes}
        selectedNodeIds={[]}
        onNodeSelect={() => {}}
        onNodeDelete={() => {}}
      />,
    );

    const content = screen.getByText(/Recent node with/);
    expect(content.textContent).toContain('...');
  });
});
