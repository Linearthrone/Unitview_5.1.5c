"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignStaffMemberButtonProps {
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'default';
}

/** Consistent unassigned-staff CTA label per TASK-20260430-007. */
export default function AssignStaffMemberButton({
  onClick,
  className,
  size = 'sm',
}: AssignStaffMemberButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn('font-medium', className)}
    >
      <UserPlus className="mr-2 h-4 w-4" />
      + Assign staff member
    </Button>
  );
}
