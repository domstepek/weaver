import type { MouseEvent as ReactMouseEvent } from 'react';

interface ResizeHandleProps {
  ariaLabel: string;
  isActive: boolean;
  onMouseDown: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

export function ResizeHandle({
  ariaLabel,
  isActive,
  onMouseDown,
}: ResizeHandleProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onMouseDown={onMouseDown}
      className={`
        w-1 shrink-0 cursor-col-resize transition-colors
        ${isActive ? 'bg-accent' : 'bg-border hover:bg-border-strong'}
      `}
    />
  );
}
