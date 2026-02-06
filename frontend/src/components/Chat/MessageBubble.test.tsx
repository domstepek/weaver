import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Message } from '@/api/client';
import { MessageBubble } from './MessageBubble';

const baseMessage: Message = {
  id: 'm1',
  nodeId: 'n1',
  role: 'assistant',
  position: 1,
  content: 'Hello [Node A](11111111-1111-1111-1111-111111111111) and [OpenAI](https://openai.com) with `inline` code',
  name: null,
  isPinned: false,
  createdAt: new Date('2026-02-06T10:00:00.000Z').toISOString(),
};

describe('MessageBubble', () => {
  it('renders node reference button, external links, and inline code', () => {
    const onNodeClick = vi.fn();

    render(
      <MessageBubble
        message={baseMessage}
        onPinClick={() => {}}
        onNodeClick={onNodeClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Node A' }));
    expect(onNodeClick).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');

    const externalLink = screen.getByRole('link', { name: 'OpenAI' });
    expect(externalLink).toHaveAttribute('href', 'https://openai.com');
    expect(externalLink).toHaveAttribute('target', '_blank');

    expect(screen.getByText('inline')).toBeInTheDocument();
  });

  it('calls onPinClick and renders pinned state title', () => {
    const onPinClick = vi.fn();

    render(
      <MessageBubble
        message={{ ...baseMessage, isPinned: true, role: 'user' }}
        onPinClick={onPinClick}
        onNodeClick={() => {}}
      />,
    );

    const pinButton = screen.getByRole('button', { name: 'Edit pinned node' });
    fireEvent.click(pinButton);
    expect(onPinClick).toHaveBeenCalledTimes(1);

    expect(screen.getByText('Edit pinned node')).toBeInTheDocument();
  });
});
