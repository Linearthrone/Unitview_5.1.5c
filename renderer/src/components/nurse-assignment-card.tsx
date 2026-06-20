
"use client";

import React from 'react';
import type { Nurse } from '@/types/nurse';
import type { Patient } from '@/types/patient';
import type { StaffRole } from '@/types/patient';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { User, Shield, Users, Trash2, XSquare, UserPlus, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isStaffUnassigned } from '@/lib/roles';
import UnassignedStaffNameButton from '@/components/unassigned-staff-name-button';
import NurseCardResizeHandle from '@/components/nurse-card-resize-handle';
import {
  MAX_NURSE_CARD_ROW_SPAN,
  MIN_NURSE_CARD_ROW_SPAN,
  getEffectiveNurseCardRowSpan,
} from '@/lib/nurse-card-layout';

export interface NurseAssignContext {
  nurseId: string;
  role: StaffRole;
}

interface NurseAssignmentCardProps {
  nurse: Nurse;
  patients: Patient[];
  onDropOnSlot: (nurseId: string, slotIndex: number) => void;
  onClearAssignments: (nurseId: string) => void;
  onRemoveNurse: (nurseId: string) => void;
  onAssignStaff?: (context: NurseAssignContext) => void;
  onResizeCardRowSpan?: (nurseId: string, rowSpan: number) => void;
  isEffectivelyLocked: boolean;
  isReadOnly?: boolean;
}

const NurseAssignmentCard: React.FC<NurseAssignmentCardProps> = ({
  nurse,
  patients,
  onDropOnSlot,
  onClearAssignments,
  onRemoveNurse,
  onAssignStaff,
  onResizeCardRowSpan,
  isEffectivelyLocked,
  isReadOnly = false,
}) => {
  const patientMap = new Map(patients.map(p => [p.id, p]));
  const assignedCount = nurse.assignedPatientIds.filter(id => id !== null).length;
  const slotCount = nurse.assignedPatientIds.length;
  const isAtCapacity = assignedCount >= slotCount;
  const unassigned = isStaffUnassigned(nurse.name);
  const locked = isEffectivelyLocked || isReadOnly;
  const cardRowSpan = getEffectiveNurseCardRowSpan(nurse);
  const compactLayout = cardRowSpan <= 2;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!locked && !isAtCapacity) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, slotIndex: number) => {
    e.preventDefault();
    if (locked || isAtCapacity) return;
    onDropOnSlot(nurse.id, slotIndex);
  };
  
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (locked) return;
    onRemoveNurse(nurse.id);
  };

  const cardBody = (
    <Card className={cn(
      "flex flex-col h-full min-h-0 overflow-hidden shadow-lg bg-card border-l-4 border-l-primary relative",
      !locked && "cursor-grab"
    )}>
       {!locked && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleRemoveClick}
          title={`Remove ${nurse.name}`}
        >
          <XSquare className="h-4 w-4" />
        </Button>
      )}
      <CardHeader className="p-3 pr-8">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-primary shrink-0" />
          {!isReadOnly && unassigned && onAssignStaff ? (
            <UnassignedStaffNameButton
              name={nurse.name}
              onAssign={() => onAssignStaff({ nurseId: nurse.id, role: nurse.role })}
              className="text-lg font-semibold truncate"
            />
          ) : (
            <span className="truncate">{nurse.name}</span>
          )}
          <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums shrink-0">
            {assignedCount}/{slotCount}
          </span>
        </CardTitle>
        <div className="text-xs text-muted-foreground flex flex-col">
            <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span>Spectra: {nurse.spectra}</span>
            </div>
            {nurse.relief && (
                <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <span>Relief: {nurse.relief}</span>
                </div>
            )}
            <div className="pt-1">
              Slots: {slotCount} patients
            </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent
        className={cn(
          'p-2 flex-1 min-h-0 overflow-y-auto grid gap-1',
          compactLayout ? 'grid-cols-2 auto-rows-[1.375rem]' : 'grid-cols-1',
        )}
      >
        {nurse.assignedPatientIds.map((patientId, index) => {
          const patient = patientId ? patientMap.get(patientId) : null;
          return (
            <div
              key={index}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={cn(
                "border-2 border-dashed rounded-md flex items-center justify-center font-semibold shrink-0",
                compactLayout ? "h-[1.375rem] text-[0.65rem] px-1" : "h-8 text-sm",
                locked ? "border-gray-400" : "border-primary/60 hover:bg-primary/10",
                !patient && isAtCapacity && "opacity-60 border-muted-foreground/50 bg-muted/20",
                patient ? "border-solid bg-card" : ""
              )}
            >
              {patient ? `Bed ${patient.bedNumber}` : 'Assign...'}
            </div>
          );
        })}
      </CardContent>
      {!isReadOnly && (
        <CardFooter className="p-2 pr-7 border-t">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => onClearAssignments(nurse.id)}
            disabled={locked}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Assignments
          </Button>
        </CardFooter>
      )}
      {!locked && onResizeCardRowSpan && (
        <NurseCardResizeHandle
          rowSpan={cardRowSpan}
          minRowSpan={MIN_NURSE_CARD_ROW_SPAN}
          maxRowSpan={MAX_NURSE_CARD_ROW_SPAN}
          onResize={(nextRowSpan) => onResizeCardRowSpan(nurse.id, nextRowSpan)}
        />
      )}
    </Card>
  );

  if (isReadOnly) {
    return cardBody;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild disabled={locked}>
        {cardBody}
      </ContextMenuTrigger>
      <ContextMenuContent>
        {unassigned && onAssignStaff && (
          <ContextMenuItem onClick={() => onAssignStaff({ nurseId: nurse.id, role: nurse.role })}>
            <UserPlus className="mr-2 h-4 w-4" />
            Assign staff member
          </ContextMenuItem>
        )}
        {!unassigned && onAssignStaff && (
          <ContextMenuItem onClick={() => onAssignStaff({ nurseId: nurse.id, role: nurse.role })}>
            <UserPlus className="mr-2 h-4 w-4" />
            Change assigned staff
          </ContextMenuItem>
        )}
        <ContextMenuItem
          onClick={() => onClearAssignments(nurse.id)}
          disabled={locked || assignedCount === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear patient assignments
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onRemoveNurse(nurse.id)}
          disabled={locked}
        >
          <UserX className="mr-2 h-4 w-4" />
          Remove nurse card
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default NurseAssignmentCard;
