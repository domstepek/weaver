import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useResizablePanel } from './useResizablePanel';

function createContainerRef(left = 100, right = 600) {
  return {
    current: {
      getBoundingClientRect: () => ({
        left,
        right,
      }),
    },
  } as unknown as React.RefObject<HTMLDivElement | null>;
}

describe('useResizablePanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  it('loads width from storage and clamps to dynamic max', async () => {
    window.localStorage.setItem('panel-width', '800');

    const { result } = renderHook(() =>
      useResizablePanel({
        containerRef: createContainerRef(),
        defaultWidth: 300,
        getMaxWidth: () => 420,
        maxWidth: 560,
        minWidth: 240,
        side: 'left',
        storageKey: 'panel-width',
      }),
    );

    await waitFor(() => {
      expect(result.current.width).toBe(420);
    });
  });

  it('resizes from the left and cleans up cursor styles on mouseup', async () => {
    const { result } = renderHook(() =>
      useResizablePanel({
        containerRef: createContainerRef(100, 700),
        defaultWidth: 288,
        getMaxWidth: () => 500,
        maxWidth: 560,
        minWidth: 240,
        side: 'left',
        storageKey: 'left-panel',
      }),
    );

    act(() => {
      result.current.startResizing({ preventDefault: vi.fn() } as unknown as React.MouseEvent<HTMLButtonElement>);
    });

    await waitFor(() => {
      expect(result.current.isResizing).toBe(true);
      expect(document.body.style.cursor).toBe('col-resize');
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 380 }));
    });

    expect(result.current.width).toBe(280);

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    await waitFor(() => {
      expect(result.current.isResizing).toBe(false);
      expect(document.body.style.cursor).toBe('');
      expect(document.body.style.userSelect).toBe('');
    });
  });

  it('resizes from the right and clamps to min width', async () => {
    const { result } = renderHook(() =>
      useResizablePanel({
        containerRef: createContainerRef(100, 600),
        defaultWidth: 384,
        getMaxWidth: () => 560,
        maxWidth: 560,
        minWidth: 320,
        side: 'right',
        storageKey: 'right-panel',
      }),
    );

    act(() => {
      result.current.startResizing({ preventDefault: vi.fn() } as unknown as React.MouseEvent<HTMLButtonElement>);
    });

    await waitFor(() => {
      expect(result.current.isResizing).toBe(true);
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 550 }));
    });

    expect(result.current.width).toBe(320);
  });

  it('ignores startResizing when bounds are unavailable and responds to clampWidth', () => {
    const emptyRef = { current: null } as React.RefObject<HTMLDivElement | null>;

    const { result } = renderHook(() =>
      useResizablePanel({
        containerRef: emptyRef,
        defaultWidth: 300,
        getMaxWidth: () => 260,
        maxWidth: 560,
        minWidth: 240,
        side: 'left',
        storageKey: 'empty-ref-panel',
      }),
    );

    act(() => {
      result.current.startResizing({ preventDefault: vi.fn() } as unknown as React.MouseEvent<HTMLButtonElement>);
    });

    expect(result.current.isResizing).toBe(false);

    act(() => {
      result.current.clampWidth();
    });

    expect(result.current.width).toBe(260);
  });
});
