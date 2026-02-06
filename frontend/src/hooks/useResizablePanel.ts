import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, RefObject } from 'react';

type ResizeSide = 'left' | 'right';

interface UseResizablePanelOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  defaultWidth: number;
  getMaxWidth: () => number;
  maxWidth: number;
  minWidth: number;
  side: ResizeSide;
  storageKey: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function useResizablePanel({
  containerRef,
  defaultWidth,
  getMaxWidth,
  maxWidth,
  minWidth,
  side,
  storageKey,
}: UseResizablePanelOptions) {
  const dragAnchorRef = useRef(0);
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') {
      return defaultWidth;
    }

    const storedWidth = window.localStorage.getItem(storageKey);
    const parsedWidth = storedWidth ? Number.parseInt(storedWidth, 10) : NaN;
    const initialWidth = Number.isFinite(parsedWidth) ? parsedWidth : defaultWidth;

    return clamp(initialWidth, minWidth, maxWidth);
  });

  const clampToBounds = useCallback(
    (value: number) => clamp(value, minWidth, getMaxWidth()),
    [getMaxWidth, minWidth],
  );

  const clampWidth = useCallback(() => {
    setWidth((currentWidth) => clampToBounds(currentWidth));
  }, [clampToBounds]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, String(width));
  }, [storageKey, width]);

  useEffect(() => {
    clampWidth();
  }, [clampWidth]);

  useEffect(() => {
    const handleWindowResize = () => {
      setWidth((currentWidth) => clampToBounds(currentWidth));
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [clampToBounds]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      const nextWidth =
        side === 'left'
          ? event.clientX - dragAnchorRef.current
          : dragAnchorRef.current - event.clientX;

      setWidth(clampToBounds(nextWidth));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [clampToBounds, isResizing, side]);

  const startResizing = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;

      dragAnchorRef.current = side === 'left' ? bounds.left : bounds.right;
      setIsResizing(true);
    },
    [containerRef, side],
  );

  return {
    clampWidth,
    isResizing,
    startResizing,
    width,
  };
}
