
"use client";

import React from 'react';
import type { Nurse } from '@/types/nurse';
import type { Patient } from '@/types/patient';
import type { StaffRole } from '@/types/patient';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Users, Trash2, XSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isStaffUnassigned } from '@/lib/roles';
import AssignStaffMemberButton from '@/components/assign-staff-member-button';

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
  isEffectivelyLocked,
  isReadOnly = false,
}) => {
  const patientMap = new Map(patients.map(p => [p.id, p]));
  const assignedCount = nurse.assignedPatientIds.filter(id => id !== null).length;
  const isAtCapacity = assignedCount >= nurse.assignedPatientIds.length;
  const unassigned = isStaffUnassigned(nurse.name);
  const locked = isEffectivelyLocked || isReadOnly;

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

  return (
    <Card className={cn(
      "flex flex-col h-full shadow-lg bg-card border-l-4 border-l-primary relative",
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
          <User className="h-5 w-5 text-primary" />
          <span>{nurse.name}</span>
          <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">
            {assignedCount}/{nurse.assignedPatientIds.length}
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
              Capacity: {nurse.assignedPatientIds.length} patients
            </div>
            {!isReadOnly && unassigned && onAssignStaff && (
              <div className="pt-2">
                <AssignStaffMemberButton
                  onClick={() => onAssignStaff({ nurseId: nurse.id, role: nurse.role })}
                />
              </div>
            )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-2 flex-grow grid grid-cols-1 gap-1">
        {nurse.assignedPatientIds.map((patientId, index) => {
          const patient = patientId ? patientMap.get(patientId) : null;
          return (
            <div
              key={index}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={cn(
                "border-2 border-dashed rounded-md flex items-center justify-center text-sm font-semibold h-8",
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
        <CardFooter className="p-2 border-t">
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
    </Card>
  );
};

export default NurseAssignmentCard;
