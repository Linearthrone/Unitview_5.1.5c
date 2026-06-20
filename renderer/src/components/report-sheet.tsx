
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Patient, MobilityStatus } from '@/types/patient';
import type { Nurse, PatientCareTech } from '@/types/nurse';
import { cn } from '@/lib/utils';
import {
  User,
  Cake,
  VenetianMask,
  FileText,
  CalendarDays,
  Utensils,
  Footprints,
  FileHeart,
  AlertTriangle,
  BrainCircuit,
  Wind,
  UserMinus,
  BedDouble,
  Accessibility,
  UserRound,
  Info,
  Ban,
  Clock,
  Droplets,
  Pill,
  ShieldAlert,
  type LucideIcon,
  Wrench,
} from 'lucide-react';
import {
  formatStaffAssignmentLabel,
  resolveAssignedNurse,
  resolveAssignedTech,
} from '@/lib/patient-staff-assignments';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getIsolationType,
  hasBloodOrders,
  hasHdPd,
  hasTimeCriticalMeds,
} from '@/lib/patient-clinical-helpers';

interface ReportSheetProps {
  patient: Patient | null;
  nurses?: Nurse[];
  techs?: PatientCareTech[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDischarge: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
  canSeePatientIdentifiers?: boolean;
  isReadOnly?: boolean;
}

const mobilityIcons: Record<MobilityStatus, LucideIcon> = {
  'Bed Rest': BedDouble,
  'Assisted': Accessibility,
  'Independent': Footprints,
};

const ReportSheet: React.FC<ReportSheetProps> = ({
  patient,
  nurses = [],
  techs = [],
  open,
  onOpenChange,
  onDischarge,
  onEditPatient,
  canSeePatientIdentifiers = true,
  isReadOnly = false,
}) => {
  if (!patient) return null;

  const MobilityIcon = mobilityIcons[patient.mobility] || Footprints;

  const formatDate = (date: Date) => {
    try {
        if (isNaN(new Date(date).getTime())) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return 'N/A';
    }
  };

  const getRiskBadge = (text: string, Icon: React.ElementType, isApplicable: boolean) => {
    if (!isApplicable) return null;
    return (
      <Badge variant="destructive" className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span>{text}</span>
      </Badge>
    );
  };
  
  const isVacant = patient.name === 'Vacant';
  const { isBlocked } = patient;
  const currentNurse = resolveAssignedNurse(patient, nurses);
  const currentTech = resolveAssignedTech(patient, techs);
  const priorNurse = patient.priorShiftNurse?.trim();
  const priorTech = patient.priorShiftTech?.trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="bg-secondary p-4 text-left sticky top-0 z-10 border-b">
          <SheetTitle className="text-2xl flex items-center gap-3">
             {canSeePatientIdentifiers ? patient.name : patient.roomDesignation}
             {isBlocked && <Badge variant="destructive"><Ban className="mr-2 h-4 w-4" />Blocked</Badge>}
          </SheetTitle>
          <SheetDescription>
            {patient.roomDesignation}
            {canSeePatientIdentifiers ? ' - Charge Nurse Report' : ' - Room status'}
          </SheetDescription>
        </SheetHeader>
        
        {!isVacant && !isBlocked && (
          <div className="flex-grow overflow-y-auto">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-muted/40 px-4 h-11">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="clinical">Clinical</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="p-6 space-y-6 mt-0">
                {canSeePatientIdentifiers && (
                  <section>
                    <h3 className="font-semibold text-lg mb-3 text-primary">Patient Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /> <span>Name: {patient.name}</span></div>
                      <div className="flex items-center gap-3"><Cake className="h-4 w-4 text-muted-foreground" /> <span>Age: {patient.age}</span></div>
                      <div className="flex items-center gap-3"><VenetianMask className="h-4 w-4 text-muted-foreground" /> <span>Gender: {patient.gender || 'N/A'}</span></div>
                    </div>
                  </section>
                )}
                {canSeePatientIdentifiers && (
                  <section>
                    <h3 className="font-semibold text-lg mb-3 text-primary">Staff assignments</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-3">
                        <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>
                          Current nurse:{' '}
                          <span className="font-medium">{formatStaffAssignmentLabel(currentNurse)}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>
                          Current PCT:{' '}
                          <span className="font-medium">{formatStaffAssignmentLabel(currentTech)}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1 border-t border-border/60">
                        <UserRound className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                        <span className="text-muted-foreground">
                          Prior shift nurse:{' '}
                          <span className="font-medium text-foreground">
                            {formatStaffAssignmentLabel(priorNurse)}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Wrench className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                        <span className="text-muted-foreground">
                          Prior shift PCT:{' '}
                          <span className="font-medium text-foreground">
                            {formatStaffAssignmentLabel(priorTech)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </section>
                )}
                {canSeePatientIdentifiers && (
                  <section>
                    <h3 className="font-semibold text-lg mb-3 text-primary">Admission Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-3"><FileText className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" /> <div><span className="font-medium">Chief Complaint:</span> {patient.chiefComplaint}</div></div>
                      <div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-muted-foreground" /> <span>Admit Date: {formatDate(patient.admitDate)}</span></div>
                      <div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-muted-foreground" /> <span>EDD: {formatDate(patient.dischargeDate)}</span></div>
                    </div>
                  </section>
                )}
              </TabsContent>

              <TabsContent value="clinical" className="p-6 space-y-6 mt-0">
                <section>
                  <h3 className="font-semibold text-lg mb-3 text-primary">Clinical Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3"><Utensils className="h-4 w-4 text-muted-foreground" /> <span>Diet: {patient.diet}</span></div>
                    <div className="flex items-center gap-3"><MobilityIcon className="h-4 w-4 text-muted-foreground" /> <span>Mobility: {patient.mobility}</span></div>
                    <div className="flex items-center gap-3"><Info className="h-4 w-4 text-muted-foreground" /> <span>Alert & Oriented: {patient.orientationStatus.toUpperCase()}</span></div>
                    <div className="flex items-start gap-3"><FileHeart className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" /> <div><span className="font-medium">LDAs:</span> {patient.ldas.length > 0 ? patient.ldas.join(', ') : 'None'}</div></div>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3 text-primary">Critical Quick Checks</h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <CriticalCheck label="Isolation" active={patient.isIsolation} detail={getIsolationType(patient) ?? undefined} />
                    <CriticalCheck label="Restraints" active={patient.isInRestraints} />
                    <CriticalCheck label="DNR/DNI" active={patient.codeStatus !== 'Full Code'} detail={patient.codeStatus} />
                    <CriticalCheck label="Comfort care" active={patient.isComfortCareDNR} />
                    <CriticalCheck label="Time-critical meds" active={hasTimeCriticalMeds(patient)} icon={Pill} />
                    <CriticalCheck label="HD/PD" active={hasHdPd(patient)} icon={Droplets} />
                    <CriticalCheck label="Blood orders" active={hasBloodOrders(patient)} icon={Clock} />
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3 text-primary">High-Risk Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {getRiskBadge('Fall Risk', AlertTriangle, patient.isFallRisk)}
                    {getRiskBadge('Seizure Risk', BrainCircuit, patient.isSeizureRisk)}
                    {getRiskBadge('Aspiration Risk', Wind, patient.isAspirationRisk)}
                    {!patient.isFallRisk && !patient.isSeizureRisk && !patient.isAspirationRisk && (
                      <p className="text-sm text-muted-foreground">No high-risk categories identified.</p>
                    )}
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="notes" className="p-6 mt-0">
                <section>
                  <h3 className="font-semibold text-lg mb-3 text-primary">Notes / Pending</h3>
                  {canSeePatientIdentifiers ? (
                    patient.notes ? (
                      <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No notes or pending procedures entered.</p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">Notes hidden in display mode.</p>
                  )}
                </section>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {(isVacant || isBlocked) && (
            <div className="flex-grow flex items-center justify-center text-center p-6">
                 {isBlocked 
                    ? <p className="text-destructive font-semibold">This room is blocked and out of service.</p>
                    : <p className="text-muted-foreground">This room is currently vacant.</p>
                 }
            </div>
        )}
        
        <div className="p-4 border-t mt-auto bg-card">
          {!isReadOnly && (
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-sky-500 hover:bg-sky-400 text-white"
              onClick={() => onEditPatient(patient)}
              disabled={isBlocked}
            >
              <Info className="mr-2 h-4 w-4" />
              Edit / Add Patient Information
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => onDischarge(patient)}
              disabled={isVacant || isBlocked}
            >
              <UserMinus className="mr-2 h-4 w-4" />
              Discharge / Transfer-Out Patient
            </Button>
          </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

function CriticalCheck({
  label,
  active,
  detail,
  icon: Icon = ShieldAlert,
}: {
  label: string;
  active: boolean;
  detail?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', active ? 'text-amber-500' : 'text-muted-foreground')} />
        <span className="font-medium">{label}</span>
      </div>
      <Badge variant={active ? 'destructive' : 'secondary'}>
        {active ? detail ?? 'Yes' : 'No'}
      </Badge>
    </div>
  );
}

export default ReportSheet;
