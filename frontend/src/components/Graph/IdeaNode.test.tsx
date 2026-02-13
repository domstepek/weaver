import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IdeaNode } from './IdeaNode';

vi.mock('@xyflow/react', () => ({
  Handle: ({ type }: { type: string }) => <div data-testid={`handle-${type}`} />,
  Position: {
    Top: 'top',
    Bottom: 'bottom',
  },
}));

describe('IdeaNode', () => {
  it('renders fallback name, truncated content, and both handles', () => {
    const longContent = 'A'.repeat(200);

    render(
      <IdeaNode
        id="11111111-1111-1111-1111-111111111111"
        type="idea"
        selected={false}
        data={{
          id: '11111111-1111-1111-1111-111111111111',
          content: longContent,
          name: null,
          isPinned: false,
        }}
        position={{ x: 0, y: 0 }}
      />,
    );

    expect(screen.getByText('Node-11111111')).toBeInTheDocument();
    expect(screen.getByText(`${'A'.repeat(150)}...`)).toBeInTheDocument();
    expect(screen.getByTestId('handle-target')).toBeInTheDocument();
    expect(screen.getByTestId('handle-source')).toBeInTheDocument();
  });

  it('renders pinned indicator and selected styles', () => {
    const { container } = render(
      <IdeaNode
        id="n2"
        type="idea"
        selected
        data={{
          id: 'n2',
          content: 'Pinned content',
          name: 'Pinned node',
          isPinned: true,
        }}
        position={{ x: 0, y: 0 }}
      />,
    );

    expect(screen.getByText('Pinned node')).toBeInTheDocument();
    expect(container.querySelector('.border-border-accent')).toBeTruthy();
    expect(container.querySelector('.text-status-warning')).toBeTruthy();
  });
});
