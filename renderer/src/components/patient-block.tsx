
"use client";

import type { Patient, MobilityStatus } from '@/types/patient';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  BedDouble,
  Accessibility,
  Footprints,
  AlertTriangle,
  ShieldAlert,
  Ban,
  BrainCircuit,
  Wind,
  HeartHandshake,
  UserPlus,
  UserMinus,
  Edit,
  Lock,
  Unlock,
  Trash2,
  Check,
  Mars,
  Venus,
  StickyNote,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertDisplayInfo {
  IconComponent: LucideIcon;
  colorClass: string;
  tooltipText: string;
}

interface PatientBlockProps {
  patient: Patient;
  isDragging?: boolean;
  isEffectivelyLocked?: boolean;
  onSelectPatient: (patient: Patient) => void;
  onAdmit: (patient: Patient) => void;
  onUpdate: (patient: Patient) => void;
  onDischarge: (patient: Patient) => void;
  onToggleBlock: (patientId: string) => void;
  onEditDesignation: (patient: Patient) => void;
  onDeleteRoom?: (patientId: string) => void;
  onQuickNote?: (patient: Patient) => void;
  /** WALLDISPLAY and privacy — hide patient names/PHI. */
  canSeePatientIdentifiers?: boolean;
  isReadOnly?: boolean;
}


const mobilityIcons: Record<MobilityStatus, LucideIcon> = {
  'Bed Rest': BedDouble,
  'Assisted': Accessibility,
  'Independent': Footprints,
};

const PatientBlock: React.FC<PatientBlockProps> = ({ 
  patient, 
  isDragging, 
  isEffectivelyLocked,
  onSelectPatient,
  onAdmit,
  onUpdate,
  onDischarge,
  onToggleBlock,
  onEditDesignation,
  onDeleteRoom,
  onQuickNote,
  canSeePatientIdentifiers = true,
  isReadOnly = false,
}) => {
  const isVacant = patient.name === 'Vacant';
  const { isBlocked } = patient;

  const handleCardClick = () => {
    if (isBlocked) return;
    onSelectPatient(patient);
  }

  if (isVacant && !isBlocked) {
    return (
       <ContextMenu>
        <ContextMenuTrigger disabled={isEffectivelyLocked || isReadOnly}>
          <Card 
            onClick={handleCardClick}
            className="flex flex-col h-full shadow-lg bg-muted/40 border-border cursor-pointer"
            title={`View report for ${patient.roomDesignation}`}
          >
            <CardHeader className="p-3">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>{patient.roomDesignation}</span>
                <Badge variant="secondary">Vacant</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex-grow flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Room Available</span>
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {!isReadOnly && (
            <>
          <ContextMenuItem onClick={() => onAdmit(patient)}>
            <UserPlus className="mr-2 h-4 w-4" /> Admit Patient
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onEditDesignation(patient)}>
            <Edit className="mr-2 h-4 w-4" /> Change Designation
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onToggleBlock(patient.id)}>
            <Lock className="mr-2 h-4 w-4" /> Block Room
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem 
            onClick={() => onDeleteRoom?.(patient.id)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Room
          </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  }
  
  const MobilityIcon = mobilityIcons[patient.mobility];

  const formatDate = (date: Date): string => {
    try {
      if (isNaN(date.getTime())) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
    } catch {
      return 'N/A'
    }
  };

  const getNameBadgeColor = () => {
    if (patient.isComfortCareDNR) {
      return "bg-purple-300 dark:bg-purple-900 border-purple-500 dark:border-purple-700 text-purple-900 dark:text-purple-100";
    }
    return "bg-card border-border text-foreground";
  };

  const GenderIcon = patient.gender === 'Male' ? Mars : patient.gender === 'Female' ? Venus : null;
  const genderIconColor =
    patient.gender === 'Male'
      ? 'text-sky-600 dark:text-sky-400'
      : patient.gender === 'Female'
        ? 'text-pink-600 dark:text-pink-400'
        : 'text-muted-foreground';

  const ldaText = (patient.ldas ?? []).join(' ').toLowerCase();
  const hasCentralLine = ldaText.includes('central') || ldaText.includes('picc') || ldaText.includes('midline');
  const hasTubeFeed = ldaText.includes('tube feed') || ldaText.includes('ng') || ldaText.includes('peg');


  const alerts: AlertDisplayInfo[] = [];
  if (patient.isFallRisk) {
    alerts.push({ IconComponent: AlertTriangle, colorClass: 'text-accent', tooltipText: 'Fall Risk' });
  }
  if (patient.isSeizureRisk) {
    alerts.push({ IconComponent: BrainCircuit, colorClass: 'text-accent', tooltipText: 'Seizure Risk' });
  }
  if (patient.isAspirationRisk) {
    alerts.push({ IconComponent: Wind, colorClass: 'text-accent', tooltipText: 'Aspiration Risk' });
  }
  if (patient.isIsolation) {
    alerts.push({ IconComponent: ShieldAlert, colorClass: 'text-accent', tooltipText: 'Isolation Precautions' });
  }
  if (patient.isInRestraints) {
    alerts.push({ IconComponent: Ban, colorClass: 'text-destructive', tooltipText: 'Restraints' }); 
  }
  if (patient.isComfortCareDNR) {
    alerts.push({ IconComponent: HeartHandshake, colorClass: 'text-purple-600 dark:text-purple-400', tooltipText: 'Comfort Care / DNR' });
  }
  if (hasCentralLine) {
    alerts.push({ IconComponent: AlertTriangle, colorClass: 'text-teal-600 dark:text-teal-400', tooltipText: 'Central line' });
  }
  if (hasTubeFeed) {
    alerts.push({ IconComponent: AlertTriangle, colorClass: 'text-emerald-600 dark:text-emerald-400', tooltipText: 'Tube feed' });
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger disabled={isEffectivelyLocked || isReadOnly}>
        <Card 
          onClick={handleCardClick}
          className={cn(
            "relative flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-200",
            isBlocked ? "cursor-not-allowed bg-black dark:bg-gray-900 border-gray-700" : "cursor-pointer bg-card border-border",
            !isBlocked && !!patient.assignedNurse && "opacity-70",
            isDragging ? "opacity-50 ring-2 ring-primary" : ""
          )}
          data-patient-id={patient.id}
          title={isBlocked ? `${patient.roomDesignation} is blocked` : `View report for ${patient.roomDesignation}`}
        >
          {GenderIcon && canSeePatientIdentifiers && (
            <div className={cn("absolute top-1.5 left-1.5 z-[1]", genderIconColor)} aria-hidden>
              <GenderIcon className="h-4 w-4" strokeWidth={2.5} />
            </div>
          )}
          {isBlocked && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 rounded-lg">
              <Ban className="h-12 w-12 text-white/80" />
            </div>
          )}
          <CardHeader className="p-3">
            <CardTitle className="text-lg font-normal">
                <div className="flex justify-between items-start">
                    <div className="font-bold">
                        {patient.roomDesignation}
                    </div>
                     {!isVacant && (
                      <div className="text-right text-sm leading-tight">
                          <div>
                              <span className="text-xs font-light">Admit </span>
                              {formatDate(patient.admitDate)}
                          </div>
                          <div>
                              <span className="text-xs font-light">EDD </span>
                              {formatDate(patient.dischargeDate)}
                          </div>
                      </div>
                    )}
                </div>
                 <div className="pt-1">
                    {canSeePatientIdentifiers ? (
                      <Badge
                        variant={"outline"}
                        className={cn(
                          "font-semibold text-base truncate block w-full text-center py-1 px-2 border",
                          getNameBadgeColor()
                        )}
                        title={patient.name}
                      >
                          {patient.name}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-semibold text-base block w-full text-center py-1">
                        Occupied
                      </Badge>
                    )}
                </div>
                {canSeePatientIdentifiers && patient.assignedNurse && (
                  <div className="text-center text-xs font-medium text-card-foreground/90 pt-1">
                    {patient.assignedNurse}
                  </div>
                )}
            </CardTitle>
          </CardHeader>
           {!isVacant && (
            <>
              <CardContent className="p-3 flex-grow space-y-2 text-sm">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span>Mobility:</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <MobilityIcon className="h-5 w-5 text-primary" strokeWidth={2.5} aria-label={patient.mobility} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{patient.mobility}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {patient.notes && canSeePatientIdentifiers && (
                  <p className="text-xs pt-1 border-t mt-2 italic">
                    <span className="font-semibold not-italic">Notes: </span>
                    {patient.notes.length > 50 ? `${patient.notes.substring(0, 47)}...` : patient.notes}
                  </p>
                )}
              </CardContent>
              {alerts.length > 0 && (
                <CardFooter className="p-3 border-t">
                  <TooltipProvider delayDuration={100}>
                    <div className="flex gap-2 flex-wrap">
                      {alerts.map(({ IconComponent, colorClass, tooltipText }, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <IconComponent className={cn("h-5 w-5", colorClass)} strokeWidth={2.5} aria-label={tooltipText} />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{tooltipText}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>
                </CardFooter>
              )}
            </>
          )}

          {!isVacant && !isBlocked && (
            <div className="absolute bottom-1 right-2">
              {patient.assignedNurse ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" strokeWidth={3} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{canSeePatientIdentifiers ? `Assigned to ${patient.assignedNurse}` : 'Nurse assigned'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                 <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-destructive font-bold text-xl">!</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>No nurse assigned!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {isBlocked ? (
          !isReadOnly && (
          <ContextMenuItem onClick={() => onToggleBlock(patient.id)}>
            <Unlock className="mr-2 h-4 w-4" /> Unblock Room
          </ContextMenuItem>
          )
        ) : (
          !isReadOnly && (
          <>
            <ContextMenuItem onClick={() => onUpdate(patient)} disabled={isVacant}>
              <Edit className="mr-2 h-4 w-4" /> Update Info
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onAdmit(patient)} disabled={!isVacant}>
              <UserPlus className="mr-2 h-4 w-4" /> Admit Patient
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onDischarge(patient)} disabled={isVacant}>
              <UserMinus className="mr-2 h-4 w-4" /> Discharge Patient
            </ContextMenuItem>
            {onQuickNote && !isVacant && (
              <ContextMenuItem onClick={() => onQuickNote(patient)}>
                <StickyNote className="mr-2 h-4 w-4" /> Quick note
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onEditDesignation(patient)}>
              <Edit className="mr-2 h-4 w-4" /> Change Designation
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onToggleBlock(patient.id)}>
              <Lock className="mr-2 h-4 w-4" /> Block Room
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={() => onDeleteRoom?.(patient.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Room
            </ContextMenuItem>
          </>
          )
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default PatientBlock;
