"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface UnassignedStaffNameButtonProps {
  name: string;
  onAssign: () => void;
  className?: string;
}

/** Clickable placeholder name for an empty staff slot. */
export default function UnassignedStaffNameButton({
  name,
  onAssign,
  className,
}: UnassignedStaffNameButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onAssign();
      }}
      className={cn(
        'rounded-sm text-primary font-inherit',
        'hover:underline underline-offset-2 decoration-dashed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'cursor-pointer',
        className
      )}
      title="Assign staff member to this slot"
    >
      {name}
    </button>
  );
}
