import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Node } from '@/api/client';
import { searchState$, uiState$ } from '@/stores';
import { ContextControl } from './ContextControl';

const nodes: Node[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    content: 'Pinned alpha context node',
    name: 'Alpha',
    isPinned: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    content: 'Pinned beta with details',
    name: 'Beta',
    isPinned: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    content: 'Unpinned gamma item',
    name: 'Gamma',
    isPinned: false,
    createdAt: '',
    updatedAt: '',
  },
];

describe('ContextControl', () => {
  beforeEach(() => {
    searchState$.query.set('');
    uiState$.selectedNodeRefs.set([]);
    uiState$.useOnlyExplicit.set(false);
  });

  it('defaults to pinned nodes and supports selecting and clearing refs', () => {
    render(<ContextControl nodes={nodes} />);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument();

    const alphaCheckbox = screen.getAllByRole('checkbox')[1];
    fireEvent.click(alphaCheckbox);

    expect(uiState$.selectedNodeRefs.peek()).toEqual([
      '11111111-1111-1111-1111-111111111111',
    ]);
    expect(screen.getByText('1 node selected')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(uiState$.selectedNodeRefs.peek()).toEqual([]);
  });

  it('filters by search and toggles explicit-only option', () => {
    render(<ContextControl nodes={nodes} />);

    fireEvent.change(screen.getByPlaceholderText('Search nodes...'), {
      target: { value: 'gamma' },
    });

    expect(searchState$.query.peek()).toBe('gamma');
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: /use only selected nodes/i }));
    expect(uiState$.useOnlyExplicit.peek()).toBe(true);
  });

  it('shows empty state messages', () => {
    const { rerender } = render(<ContextControl nodes={[]} />);
    expect(screen.getByText('No pinned nodes available')).toBeInTheDocument();

    rerender(<ContextControl nodes={nodes} />);
    fireEvent.change(screen.getByPlaceholderText('Search nodes...'), {
      target: { value: 'does-not-match' },
    });
    expect(screen.getByText('No matching nodes')).toBeInTheDocument();
  });
});
