import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResizeHandle } from './ResizeHandle';

describe('ResizeHandle', () => {
  it('renders with inactive styles and calls onMouseDown', () => {
    const onMouseDown = vi.fn();

    render(
      <ResizeHandle
        ariaLabel="Resize conversations panel"
        isActive={false}
        onMouseDown={onMouseDown}
      />,
    );

    const handle = screen.getByRole('button', {
      name: 'Resize conversations panel',
    });

    expect(handle).toHaveClass('bg-border');

    fireEvent.mouseDown(handle);
    expect(onMouseDown).toHaveBeenCalledTimes(1);
  });

  it('renders with active styles', () => {
    render(
      <ResizeHandle
        ariaLabel="Resize chat panel"
        isActive
        onMouseDown={() => {}}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Resize chat panel' }),
    ).toHaveClass('bg-accent');
  });
});
