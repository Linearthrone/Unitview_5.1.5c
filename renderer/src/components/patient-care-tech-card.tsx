
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Users, XSquare } from 'lucide-react';
import type { PatientCareTech } from '@/types/nurse';
import type { StaffRole } from '@/types/patient';
import { cn } from '@/lib/utils';
import { isStaffUnassigned } from '@/lib/roles';
import UnassignedStaffNameButton from '@/components/unassigned-staff-name-button';

export interface TechAssignContext {
  techId: string;
  role: StaffRole;
}

interface PatientCareTechCardProps {
  tech: PatientCareTech;
  onRemoveTech: (techId: string) => void;
  onAssignStaff?: (context: TechAssignContext) => void;
  isEffectivelyLocked: boolean;
  isReadOnly?: boolean;
}

const PatientCareTechCard: React.FC<PatientCareTechCardProps> = ({
  tech,
  onRemoveTech,
  onAssignStaff,
  isEffectivelyLocked,
  isReadOnly = false,
}) => {
  const unassigned = isStaffUnassigned(tech.name);
  const locked = isEffectivelyLocked || isReadOnly;

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (locked) return;
    onRemoveTech(tech.id);
  };

  return (
    <Card className={cn(
        "flex flex-col h-full shadow-lg bg-card border-l-4 border-l-rose-500 relative",
        !locked && "cursor-grab"
    )}>
       {!locked && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleRemoveClick}
          title={`Remove ${tech.name}`}
        >
          <XSquare className="h-4 w-4" />
        </Button>
      )}
      <CardHeader className="p-2 pr-8">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <Wrench className="h-4 w-4 shrink-0" />
            {!isReadOnly && unassigned && onAssignStaff ? (
              <UnassignedStaffNameButton
                name={tech.name}
                onAssign={() => onAssignStaff({ techId: tech.id, role: 'Patient Care Tech' })}
                className="text-base font-semibold truncate"
              />
            ) : (
              <span className="truncate">{tech.name}</span>
            )}
          </div>
          <span className="text-xs font-normal shrink-0">{tech.spectra}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-grow flex flex-col justify-center items-center text-center">
        <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-bold text-sm">{tech.assignmentGroup || 'Unassigned'}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientCareTechCard;
