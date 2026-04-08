
"use client";

import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Lock,
  Unlock,
  LayoutGrid,
  Printer,
  Save,
  UserPlus,
  HelpCircle,
  ListTodo,
  PlusSquare,
  Building2,
  TestTube,
  Users,
  ClipboardSignature,
  HeartHandshake,
  Ban,
  Droplet,
  Archive,
  LogOut,
  ShieldAlert,
  UserRound,
  FileWarning,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LayoutName } from '@/types/patient';
import IconExplanationDialog from './icon-explanation-dialog';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import type { NameAlertGroup } from '@/lib/name-alerts';

interface AppHeaderProps {
  title: string;
  unitName?: string;
  activePatientCount: number;
  totalRoomCount: number;
  dnrCount: number;
  restraintCount: number;
  foleyCount: number;
  isolationCount: number;
  sitterCount: number;
  involuntaryHoldCount: number;
  nameAlertGroups: NameAlertGroup[];
  isLayoutLocked: boolean;
  onToggleLayoutLock: () => void;
  currentLayoutName: LayoutName;
  onSelectLayout?: (layoutName: LayoutName) => void;
  availableLayouts?: LayoutName[];
  onPrint: (reportType: 'charge' | 'assignments') => void;
  onSaveLayout?: () => void;
  onSaveCurrentLayout: () => void;
  onAdmitPatient: () => void;
  onAddStaffMember: () => void;
  onManageSpectra: () => void;
  onAddRoom: () => void;
  onCreateUnit?: () => void;
  onInsertMockData?: () => void;
  onSaveAssignments: () => void;
  onSetupOncomingShift?: () => void;
  onLeaveUnit?: () => void;
}

const CompactStat: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  className?: string;
}> = ({ icon: Icon, label, value, className }) => (
  <div
    className={cn(
      'flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-sm shrink-0',
      className
    )}
  >
    <Icon className="h-4 w-4 shrink-0 opacity-80" />
    <span className="font-bold tabular-nums leading-none">{value}</span>
    <span className="text-muted-foreground text-xs leading-none hidden sm:inline">{label}</span>
  </div>
);

const getFriendlyLayoutName = (layoutName: LayoutName): string => {
  switch (layoutName) {
    case 'North-South View':
      return 'North/South View';
    default:
      return layoutName;
  }
};

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  unitName,
  activePatientCount,
  totalRoomCount,
  dnrCount,
  restraintCount,
  foleyCount,
  isolationCount,
  sitterCount,
  involuntaryHoldCount,
  nameAlertGroups,
  isLayoutLocked,
  onToggleLayoutLock,
  currentLayoutName,
  onSelectLayout,
  availableLayouts,
  onPrint,
  onSaveLayout,
  onSaveCurrentLayout,
  onAdmitPatient,
  onAddStaffMember,
  onManageSpectra,
  onAddRoom,
  onCreateUnit,
  onInsertMockData,
  onSaveAssignments,
  onSetupOncomingShift,
  onLeaveUnit,
}) => {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="bg-card text-card-foreground shadow-md sticky top-0 z-50 print-hide border-b">
        <div className="px-3 sm:px-5 py-3 space-y-3 max-w-[100vw]">
          {/* Row 1: identity, census, stats, time / leave */}
          <div className="flex flex-wrap items-start gap-x-6 gap-y-3 justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <Stethoscope className="h-10 w-10 sm:h-12 sm:w-12 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary leading-tight">
                  {title}
                </h1>
                {unitName && (
                  <h2 className="text-lg sm:text-xl font-semibold text-primary mt-0.5 truncate">
                    {unitName}
                  </h2>
                )}
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  {activePatientCount} Patients / {totalRoomCount} Rooms
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 max-w-full">
              <CompactStat
                icon={HeartHandshake}
                label="DNR"
                value={dnrCount}
                className="text-purple-700 dark:text-purple-400"
              />
              <CompactStat
                icon={Ban}
                label="Restraints"
                value={restraintCount}
                className="text-destructive"
              />
              <CompactStat
                icon={ShieldAlert}
                label="Isolation"
                value={isolationCount}
                className="text-amber-700 dark:text-amber-400"
              />
              <CompactStat
                icon={FileWarning}
                label="1013/2013"
                value={involuntaryHoldCount}
                className="text-orange-700 dark:text-orange-400"
              />
              <CompactStat
                icon={UserRound}
                label="Sitter"
                value={sitterCount}
                className="text-sky-700 dark:text-sky-400"
              />
              <CompactStat icon={Droplet} label="Foleys" value={foleyCount} className="text-blue-600" />
            </div>

            <div className="flex items-center gap-3 ml-auto sm:ml-0">
              {!onLeaveUnit && availableLayouts && onSelectLayout && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0">
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      <span className="max-w-[10rem] truncate">
                        {getFriendlyLayoutName(currentLayoutName)}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Select unit layout</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableLayouts.map((layoutName) => (
                      <DropdownMenuItem
                        key={layoutName}
                        onClick={() => onSelectLayout(layoutName)}
                        disabled={layoutName === currentLayoutName}
                      >
                        {getFriendlyLayoutName(layoutName)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {onLeaveUnit && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onLeaveUnit}
                  className="shrink-0 font-semibold"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave unit
                </Button>
              )}
              <div className="text-right shrink-0 tabular-nums">
                <div className="font-semibold text-lg leading-none">
                  {currentTime
                    ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </div>
                <div className="text-xs text-muted-foreground mt-1 max-w-[9rem] sm:max-w-none">
                  {currentTime
                    ? currentTime.toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Name similarity alerts */}
          {nameAlertGroups.length > 0 && (
            <div
              className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"
              role="status"
            >
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Name alerts</p>
              <ul className="space-y-1.5 text-amber-950/90 dark:text-amber-50/90">
                {nameAlertGroups.map((g) => (
                  <li key={g.key}>
                    <span className="font-medium">{g.label}:</span>{' '}
                    {g.entries.map((e) => `${e.name} (${e.room})`).join(' · ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Row 2: primary actions (horizontal bar) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
            <Button variant="default" size="sm" onClick={onAdmitPatient} title="Admit / transfer in">
              <UserPlus className="h-4 w-4 mr-1.5" />
              Admit
            </Button>
            <Button variant="outline" size="sm" onClick={onAddStaffMember} title="Add staff">
              <Users className="h-4 w-4 mr-1.5" />
              Staff
            </Button>
            <Button variant="outline" size="sm" onClick={onManageSpectra} title="Spectra pool">
              <ListTodo className="h-4 w-4 mr-1.5" />
              Spectra
            </Button>
            {onSetupOncomingShift && (
              <Button variant="outline" size="sm" onClick={onSetupOncomingShift} title="Oncoming shift board">
                <ClipboardSignature className="h-4 w-4 mr-1.5" />
                Oncoming shift
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-1.5" />
                  Print
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => onPrint('charge')}>
                  <Printer className="mr-2 h-4 w-4" />
                  Charge report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPrint('assignments')}>
                  <ClipboardSignature className="mr-2 h-4 w-4" />
                  Assignments
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-7 hidden sm:block" />

            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={onToggleLayoutLock}
              title={isLayoutLocked ? 'Unlock layout' : 'Lock layout'}
            >
              {isLayoutLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={onSaveCurrentLayout}
              disabled={isLayoutLocked}
              title="Save current layout"
            >
              <Save className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" title="More tools">
                  <TestTube className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Admin &amp; dev</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {onCreateUnit && (
                  <DropdownMenuItem onClick={onCreateUnit}>
                    <Building2 className="mr-2 h-4 w-4" />
                    Create new unit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onAddRoom}>
                  <PlusSquare className="mr-2 h-4 w-4" />
                  Create new room
                </DropdownMenuItem>
                {onSaveLayout && (
                  <DropdownMenuItem onClick={onSaveLayout} disabled={isLayoutLocked}>
                    <Save className="mr-2 h-4 w-4" />
                    Save layout as…
                  </DropdownMenuItem>
                )}
                {onInsertMockData && (
                  <DropdownMenuItem onClick={onInsertMockData}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Insert mock patients
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onSaveAssignments}>
                  <Archive className="mr-2 h-4 w-4" />
                  Save shift assignments
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsExplanationOpen(true)}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Icon explanation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <IconExplanationDialog open={isExplanationOpen} onOpenChange={setIsExplanationOpen} />
    </>
  );
};

export default AppHeader;
