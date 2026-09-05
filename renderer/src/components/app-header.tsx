
"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope,
  LayoutGrid,
  Printer,
  UserPlus,
  HelpCircle,
  ClipboardSignature,
  Users,
  HeartHandshake,
  Ban,
  Droplet,
  Archive,
  LogOut,
  ShieldAlert,
  UserRound,
  FileWarning,
  Activity,
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  Shield,
  Building2,
  PlusSquare,
  Save,
  RefreshCw,
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
  centralLineCount?: number;
  tubeFeedCount?: number;
  nameAlertGroups: NameAlertGroup[];
  onAcknowledgeNameAlerts?: () => void;
  /** When false, admit/staff/oncoming and admin tools are hidden. */
  canEdit?: boolean;
  /** Admin-only dev tools (create unit, mock patients, etc.). */
  showAdminTools?: boolean;
  currentLayoutName: LayoutName;
  onSelectLayout?: (layoutName: LayoutName) => void;
  availableLayouts?: LayoutName[];
  onPrint: (reportType: 'charge' | 'assignments') => void;
  onConfigureAssignmentPrint?: () => void;
  onAdmitPatient: () => void;
  onAddStaffMember: () => void;
  onAddRoom?: () => void;
  onCreateUnit?: () => void;
  onInsertMockData?: () => void;
  onSyncEpicCensus?: () => void;
  isSyncingEpic?: boolean;
  onSaveLayout?: () => void;
  onSaveAssignments: () => void;
  onSetupOncomingShift?: () => void;
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
  centralLineCount = 0,
  tubeFeedCount = 0,
  nameAlertGroups,
  onAcknowledgeNameAlerts,
  canEdit = true,
  showAdminTools = false,
  currentLayoutName,
  onSelectLayout,
  availableLayouts,
  onPrint,
  onConfigureAssignmentPrint,
  onAdmitPatient,
  onAddStaffMember,
  onAddRoom,
  onCreateUnit,
  onInsertMockData,
  onSyncEpicCensus,
  isSyncingEpic = false,
  onSaveLayout,
  onSaveAssignments,
  onSetupOncomingShift,
}) => {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isActionBarSticky, setIsActionBarSticky] = useState(false);
  const [statsCollapsed, setStatsCollapsed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsActionBarSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header className="bg-card text-card-foreground shadow-md z-40 print-hide border-b">
        {/* Row 1 — scrolls away with page content */}
        <div className="px-3 sm:px-5 py-3 space-y-3 max-w-[100vw]">
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

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setStatsCollapsed((v) => !v)}
              >
                {statsCollapsed ? (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                    Show stats
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 mr-1" />
                    Hide stats
                  </>
                )}
              </Button>
            </div>

            {/* Time & navigation — print lives here per checklist §3.3 / §3.5 */}
            <div className="flex items-center gap-2 ml-auto sm:ml-0 flex-wrap justify-end">
              {availableLayouts && onSelectLayout && (
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0">
                    <Printer className="h-4 w-4 mr-1.5" />
                    Print
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPrint('charge')}>
                    <Printer className="mr-2 h-4 w-4" />
                    Charge report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPrint('assignments')}>
                    <ClipboardSignature className="mr-2 h-4 w-4" />
                    Assignments
                  </DropdownMenuItem>
                  {onConfigureAssignmentPrint && (
                    <DropdownMenuItem onClick={onConfigureAssignmentPrint}>
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      Configure assignment layout…
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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

          {!statsCollapsed && (
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
              <CompactStat
                icon={Activity}
                label="Central lines"
                value={centralLineCount}
                className="text-teal-700 dark:text-teal-400"
              />
              <CompactStat
                icon={UtensilsCrossed}
                label="Tube feeds"
                value={tubeFeedCount}
                className="text-emerald-700 dark:text-emerald-400"
              />
            </div>
          )}

          {nameAlertGroups.length > 0 && (
            <div
              className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"
              role="status"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100">Name alerts</p>
                {onAcknowledgeNameAlerts && canEdit && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 border-amber-600/50 bg-amber-50/80 text-amber-950 hover:bg-amber-100 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-50 dark:hover:bg-amber-900/60"
                    onClick={onAcknowledgeNameAlerts}
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
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
        </div>

        {/* Sentinel — when this scrolls out of view, action bar becomes sticky */}
        <div ref={sentinelRef} className="h-px w-full" aria-hidden />

        {/* Row 2 — sticky action bar only (§3.7.4) */}
        <div
          className={cn(
            'px-3 sm:px-5 py-2 border-t border-border/60 bg-card/95 backdrop-blur-sm transition-shadow',
            isActionBarSticky && 'sticky top-0 z-50 shadow-md'
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            {onSyncEpicCensus && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSyncEpicCensus}
                disabled={isSyncingEpic}
                title="Sync in-progress encounters from Epic FHIR"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isSyncingEpic ? 'animate-spin' : ''}`} />
                {isSyncingEpic ? 'Syncing Epic…' : 'Sync Epic census'}
              </Button>
            )}
            {canEdit && (
              <>
                <Button variant="default" size="sm" onClick={onAdmitPatient} title="Admit / transfer in">
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Admit
                </Button>
                <Button variant="outline" size="sm" onClick={onAddStaffMember} title="Add staff">
                  <Users className="h-4 w-4 mr-1.5" />
                  Staff
                </Button>
                {onSetupOncomingShift && (
                  <Button variant="outline" size="sm" onClick={onSetupOncomingShift} title="Oncoming shift board">
                    <ClipboardSignature className="h-4 w-4 mr-1.5" />
                    Oncoming shift
                  </Button>
                )}
              </>
            )}
            <Button variant="outline" size="sm" onClick={onSaveAssignments} title="Save shift assignments">
              <Archive className="h-4 w-4 mr-1.5" />
              Save assignments
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExplanationOpen(true)}
              title="Icon explanation"
            >
              <HelpCircle className="h-4 w-4 mr-1.5" />
              Icons
            </Button>

            {showAdminTools && (
              <>
                <Separator orientation="vertical" className="h-7 hidden sm:block" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0" title="Facility and unit administration">
                      <Shield className="h-4 w-4 mr-1.5" />
                      Admin
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Facility & unit setup</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {onCreateUnit && (
                      <DropdownMenuItem onClick={onCreateUnit}>
                        <Building2 className="mr-2 h-4 w-4" />
                        Create new unit
                      </DropdownMenuItem>
                    )}
                    {onAddRoom && (
                      <DropdownMenuItem onClick={onAddRoom}>
                        <PlusSquare className="mr-2 h-4 w-4" />
                        Create new room
                      </DropdownMenuItem>
                    )}
                    {onSaveLayout && (
                      <DropdownMenuItem onClick={onSaveLayout}>
                        <Save className="mr-2 h-4 w-4" />
                        Save layout as…
                      </DropdownMenuItem>
                    )}
                    {onInsertMockData && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Development</DropdownMenuLabel>
                        <DropdownMenuItem onClick={onInsertMockData}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Insert mock patients
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </header>
      <IconExplanationDialog open={isExplanationOpen} onOpenChange={setIsExplanationOpen} />
    </>
  );
};

export default AppHeader;
