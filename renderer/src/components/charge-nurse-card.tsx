
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Smartphone, UserX, UserPlus } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { StaffRole } from '@/types/patient';
import { isStaffUnassigned } from '@/lib/roles';
import AssignStaffMemberButton from '@/components/assign-staff-member-button';

interface ChargeNurseCardProps {
  name: string;
  onAssign: (role: StaffRole) => void;
  onRemove: (role: StaffRole) => void;
  isReadOnly?: boolean;
}

const ChargeNurseCard: React.FC<ChargeNurseCardProps> = ({
  name,
  onAssign,
  onRemove,
  isReadOnly = false,
}) => {
  const unassigned = isStaffUnassigned(name);

  return (
     <ContextMenu>
      <ContextMenuTrigger disabled={isReadOnly}>
        <Card className="flex flex-col h-full shadow-lg bg-card border-l-4 border-l-primary">
          <CardHeader className="p-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <span>Charge Nurse</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-grow flex flex-col justify-center items-center text-center">
            <div className="space-y-2">
                <div>
                    <p className="text-xl font-bold">{name}</p>
                </div>
                 {!unassigned && (
                     <div>
                         <p className="font-bold text-lg flex items-center justify-center gap-2">
                            <Smartphone className="h-4 w-4"/>
                            <span>x5501</span>
                        </p>
                    </div>
                )}
                {!isReadOnly && unassigned && (
                  <AssignStaffMemberButton onClick={() => onAssign('Charge Nurse')} />
                )}
            </div>
          </CardContent>
        </Card>
      </ContextMenuTrigger>
      {!isReadOnly && (
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onAssign('Charge Nurse')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Charge Nurse
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onRemove('Charge Nurse')}
            disabled={unassigned}
          >
            <UserX className="mr-2 h-4 w-4" />
            Remove Charge Nurse
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
};

export default ChargeNurseCard;
