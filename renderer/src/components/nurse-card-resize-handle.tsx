"use client";

import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { NURSE_CARD_ROW_RESIZE_STEP_PX } from '@/lib/nurse-card-layout';

interface NurseCardResizeHandleProps {
  rowSpan: number;
  minRowSpan: number;
  maxRowSpan: number;
  disabled?: boolean;
  onResize: (nextRowSpan: number) => void;
  className?: string;
}

export default function NurseCardResizeHandle({
  rowSpan,
  minRowSpan,
  maxRowSpan,
  disabled = false,
  onResize,
  className,
}: NurseCardResizeHandleProps) {
  const lastRowSpanRef = useRef(rowSpan);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startRowSpan = rowSpan;
    lastRowSpanRef.current = startRowSpan;

    const handlePointerMove = (ev: PointerEvent) => {
      const steps = Math.round((ev.clientY - startY) / NURSE_CARD_ROW_RESIZE_STEP_PX);
      const next = Math.max(minRowSpan, Math.min(maxRowSpan, startRowSpan + steps));
      if (next !== lastRowSpanRef.current) {
        lastRowSpanRef.current = next;
        onResize(next);
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  return (
    <button
      type="button"
      aria-label={`Resize card height (${rowSpan} grid rows). Drag vertically.`}
      title="Drag to change card height on the map"
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'absolute bottom-0 right-0 z-10 flex h-6 w-6 items-end justify-end p-1',
        'cursor-se-resize touch-none text-muted-foreground/70 hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        disabled && 'cursor-not-allowed opacity-40',
        className
      )}
    >
      <span className="relative block h-3 w-3" aria-hidden>
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 border-r-2 border-b-2 border-current" />
        <span className="absolute bottom-1 right-1 block h-1.5 w-1.5 border-r border-b border-current opacity-70" />
      </span>
    </button>
  );
}
