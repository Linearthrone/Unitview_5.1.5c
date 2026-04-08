"use client";

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Nurse } from '@/types/nurse';

const DEFAULT_COLS = 3;
const DEFAULT_ROWS = 3;

interface ShiftMakerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nurses: Nurse[];
}

/** Staff / float nurses shown for oncoming shift planning (excludes charge, clerk, sitter). */
function selectShiftBoardNurses(nurses: Nurse[]): Nurse[] {
  return nurses.filter(
    (n) => n.role === 'Staff Nurse' || n.role === 'Float Pool Nurse'
  );
}

const ShiftMakerDialog: React.FC<ShiftMakerDialogProps> = ({ open, onOpenChange, nurses }) => {
  const boardNurses = useMemo(() => selectShiftBoardNurses(nurses), [nurses]);
  const capacity = DEFAULT_COLS * DEFAULT_ROWS;
  const slots = useMemo(() => {
    const out: (Nurse | null)[] = [...boardNurses];
    while (out.length < capacity) out.push(null);
    return out.slice(0, capacity);
  }, [boardNurses, capacity]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Oncoming shift assignment</DialogTitle>
          <DialogDescription>
            Planning board for staff and float nurses ({DEFAULT_COLS}×{DEFAULT_ROWS} cards). Assignments on the unit map are unchanged; use this view to brief the oncoming team.
          </DialogDescription>
        </DialogHeader>

        <div
          className="grid gap-3 py-2"
          style={{
            gridTemplateColumns: `repeat(${DEFAULT_COLS}, minmax(0, 1fr))`,
          }}
        >
          {slots.map((nurse, i) => (
            <div
              key={nurse?.id ?? `empty-${i}`}
              className="rounded-lg border bg-card p-3 min-h-[5.5rem] flex flex-col justify-center shadow-sm"
            >
              {nurse ? (
                <>
                  <p className="font-semibold text-sm leading-tight">{nurse.name || 'Unnamed'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{nurse.role}</p>
                  {nurse.spectra && (
                    <p className="text-xs text-muted-foreground mt-0.5">Spectra: {nurse.spectra}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center">Open slot</p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftMakerDialog;
