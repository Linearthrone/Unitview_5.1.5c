import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import {
  Plus,
  Settings,
  Hospital,
  Palette,
  ChevronRight,
  Layout,
  Moon,
  Sun,
  Zap,
  LogOut,
  Activity,
  ArrowRightLeft,
  BedDouble,
  Users,
  ShieldAlert,
  Pencil,
} from 'lucide-react';
import { User, UnitSettings } from '../types/auth';
import type { CreateUnitPayload, UnitType } from '../types/patient';
import { authService } from '../services/authService';
import * as layoutService from '../services/layoutService';
import { computeFacilityStatistics, type FacilityStatistics } from '../services/facilityStatsService';
import { getLastOpenedUnitName } from '../lib/last-unit-storage';
import CreateUnitDialog from './create-unit-dialog';
import UserDashboardSettings from './user-dashboard-settings';
import EditUnitDialog, { type EditUnitValues } from './edit-unit-dialog';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu';

/** Placeholder unit created in older versions; not shown on the dashboard. */
const isPlaceholderDefaultUnit = (u: UnitSettings) => u.id === 'default';

type MockUnitSeed = {
  name: string;
  theme: UnitSettings['theme'];
  unitType: UnitType;
  firstRoomNumber: number;
};

const DEV_MOCK_UNITS: MockUnitSeed[] = [
  { name: 'Mock ICU East', theme: 'blue', unitType: 'ICU', firstRoomNumber: 101 },
  { name: 'Mock Med-Surg West', theme: 'green', unitType: 'Med-Surg', firstRoomNumber: 201 },
  { name: 'Mock Telemetry North', theme: 'purple', unitType: 'Telemetry', firstRoomNumber: 301 },
];

function buildMockUnitPayload(seed: MockUnitSeed): CreateUnitPayload {
  const numRooms = 12;
  const roomDisplayNumbers = Array.from({ length: numRooms }, (_, idx) => seed.firstRoomNumber + idx);

  const roomPlacements = Array.from({ length: numRooms }, (_, idx) => {
    const row = Math.floor(idx / 6) + 1;
    const column = (idx % 6) + 1;
    return {
      id: `room-${idx + 1}`,
      kind: 'Room' as const,
      roomIndex: idx + 1,
      row,
      column,
    };
  });

  return {
    designation: seed.name,
    numRooms,
    bedsPerRoom: 1,
    baselineNursesPerShift: 3,
    baselinePctsPerShift: 1,
    nurseToPatientRatio: 4,
    unitType: seed.unitType,
    roomDisplayNumbers,
    cardPlacements: [
      ...roomPlacements,
      { id: 'nurse-1', kind: 'Staff Nurse', row: 3, column: 1 },
      { id: 'nurse-2', kind: 'Staff Nurse', row: 3, column: 3 },
      { id: 'nurse-3', kind: 'Staff Nurse', row: 3, column: 5 },
      { id: 'pct-1', kind: 'Patient Care Tech', row: 3, column: 6 },
      { id: 'unit-clerk', kind: 'Unit Clerk', row: 3, column: 2 },
    ],
  };
}

function sortUnitsWithLastFirst(units: UnitSettings[], lastName: string | null): UnitSettings[] {
  const copy = [...units];
  copy.sort((a, b) => {
    if (lastName) {
      if (a.name === lastName && b.name !== lastName) return -1;
      if (b.name === lastName && a.name !== lastName) return 1;
    }
    return a.name.localeCompare(b.name);
  });
  return copy;
}

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
  onBackToLogin: () => void;
  onEnterUnit: (unitName: string) => void | Promise<void>;
}

export default function UserDashboard({ user, onLogout, onBackToLogin, onEnterUnit }: UserDashboardProps) {
  const [units, setUnits] = useState<UnitSettings[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [facilityStats, setFacilityStats] = useState<FacilityStatistics | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCreateUnitOpen, setIsCreateUnitOpen] = useState(false);
  const [availableLayoutNames, setAvailableLayoutNames] = useState<string[]>([]);
  const [screen, setScreen] = useState<'main' | 'settings'>('main');
  const [isEditUnitOpen, setIsEditUnitOpen] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState<UnitSettings | null>(null);

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'blue' | 'green' | 'purple'>('light');

  /** Read each render so returning from a unit refreshes “last opened” from storage. */
  const lastOpenedName = getLastOpenedUnitName(user.id);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const applyTheme = useCallback((theme: 'light' | 'dark' | 'blue' | 'green' | 'purple') => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-blue', 'theme-green', 'theme-purple');
    root.classList.add(`theme-${theme}`);
    localStorage.setItem('unitview_theme', theme);
  }, []);

  const loadCurrentSettings = useCallback(() => {
    try {
      const stored = localStorage.getItem('unitview_theme');
      if (stored && ['light', 'dark', 'blue', 'green', 'purple'].includes(stored)) {
        setCurrentTheme(stored as 'light' | 'dark' | 'blue' | 'green' | 'purple');
        applyTheme(stored as 'light' | 'dark' | 'blue' | 'green' | 'purple');
        return;
      }
      const firstReal = authService.getUnitSettings().find((u) => !isPlaceholderDefaultUnit(u));
      if (firstReal) {
        setCurrentTheme(firstReal.theme);
        applyTheme(firstReal.theme);
      }
    } catch (error) {
      console.error('Failed to load current settings');
    }
  }, [applyTheme]);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setStatsLoading(true);
    try {
      let [allUnits, layouts] = await Promise.all([
        Promise.resolve(authService.getUnitSettings()),
        layoutService.getAvailableLayouts(),
      ]);

      const hasVisibleUnits = allUnits.some((u) => !isPlaceholderDefaultUnit(u));
      if (!hasVisibleUnits) {
        for (const seed of DEV_MOCK_UNITS) {
          if (!layouts.includes(seed.name)) {
            await layoutService.createFullUnitFromPayload(buildMockUnitPayload(seed));
          }
          const existsInSettings = allUnits.some((u) => u.name === seed.name);
          if (!existsInSettings) {
            const now = new Date();
            authService.saveUnitSettings({
              id: `mock-unit-${seed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
              name: seed.name,
              theme: seed.theme,
              createdAt: now,
              lastModified: now,
            });
          }
        }

        [allUnits, layouts] = await Promise.all([
          Promise.resolve(authService.getUnitSettings()),
          layoutService.getAvailableLayouts(),
        ]);
      }

      setUnits(allUnits);
      setAvailableLayoutNames(layouts);

      const visible = allUnits.filter((u) => !isPlaceholderDefaultUnit(u));
      const layoutKeys = visible.map((u) => u.name).filter((n) => layouts.includes(n));
      const stats = await computeFacilityStatistics(layoutKeys);
      setFacilityStats(stats);
    } catch {
      showMessage('error', 'Failed to load dashboard data');
      setFacilityStats(null);
    } finally {
      setIsLoading(false);
      setStatsLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadInitialData();
    loadCurrentSettings();
  }, [loadInitialData, loadCurrentSettings]);

  const visibleUnits = useMemo(
    () => units.filter((u) => !isPlaceholderDefaultUnit(u)),
    [units]
  );

  const sortedUnits = useMemo(
    () => sortUnitsWithLastFirst(visibleUnits, lastOpenedName),
    [visibleUnits, lastOpenedName]
  );

  useEffect(() => {
    if (sortedUnits.length === 0) {
      setSelectedUnit('');
      return;
    }
    const last = getLastOpenedUnitName(user.id);
    const preferred = last && sortedUnits.some((u) => u.name === last) ? last : sortedUnits[0].name;
    setSelectedUnit((prev) => (prev && sortedUnits.some((u) => u.name === prev) ? prev : preferred));
  }, [sortedUnits, user.id]);

  const handleCreateUnitWizard = async (data: CreateUnitPayload) => {
    await layoutService.createFullUnitFromPayload(data);
    const newUnit: UnitSettings = {
      id: `unit-${Date.now()}`,
      name: data.designation,
      theme: currentTheme,
      createdAt: new Date(),
      lastModified: new Date(),
    };
    const success = authService.saveUnitSettings(newUnit);
    if (!success) {
      showMessage('error', 'Unit layout was created but saving the unit to your list failed.');
      return;
    }
    setIsCreateUnitOpen(false);
    await loadInitialData();
    const layouts = await layoutService.getAvailableLayouts();
    setAvailableLayoutNames(layouts);
    setSelectedUnit(data.designation);
    showMessage('success', `Unit "${data.designation}" created. Opening…`);
    await Promise.resolve(onEnterUnit(data.designation));
  };

  const handleEnterUnit = () => {
    if (!selectedUnit) {
      showMessage('error', 'Please select a unit');
      return;
    }
    onEnterUnit(selectedUnit);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'blue' | 'green' | 'purple') => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  const handleOpenEditUnit = (unit: UnitSettings) => {
    setUnitToEdit(unit);
    setIsEditUnitOpen(true);
  };

  const handleSaveEditedUnit = async (values: EditUnitValues) => {
    if (!unitToEdit) return;
    const oldName = unitToEdit.name;
    const nextName = values.name.trim();
    const renameRequested = oldName !== nextName;

    if (renameRequested) {
      await layoutService.renameLayout(oldName, nextName);
    }

    const success = authService.saveUnitSettings({
      ...unitToEdit,
      name: nextName,
      theme: values.theme,
      lastModified: new Date(),
    });

    if (!success) {
      throw new Error('Unable to save updated unit settings.');
    }

    if (selectedUnit === oldName) {
      setSelectedUnit(nextName);
    }

    setIsEditUnitOpen(false);
    setUnitToEdit(null);
    await loadInitialData();
    showMessage('success', `Unit "${nextName}" updated.`);
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'blue':
        return <Zap className="w-4 h-4" />;
      case 'green':
        return <Palette className="w-4 h-4" />;
      case 'purple':
        return <Layout className="w-4 h-4" />;
      default:
        return <Sun className="w-4 h-4" />;
    }
  };

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-800 text-white';
      case 'blue':
        return 'bg-blue-600 text-white';
      case 'green':
        return 'bg-green-600 text-white';
      case 'purple':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-100 text-gray-900 border border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (screen === 'settings') {
    return (
      <UserDashboardSettings
        user={user}
        onBack={() => setScreen('main')}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 theme-${currentTheme}`}>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Hospital className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">UnitView</h1>
                <p className="text-sm text-gray-500">Welcome, {user.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-sm text-gray-600 hidden sm:inline">
                Role:{' '}
                <span className="font-medium">{user.role === 'admin' ? 'Administrator' : 'User'}</span>
              </span>
              <Button variant="ghost" size="icon" onClick={() => setScreen('settings')} aria-label="Settings">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="outline" onClick={onBackToLogin} className="hidden sm:inline-flex">
                Back to Login
              </Button>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {message && (
          <Alert
            className={`${
              message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            }`}
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Facility statistics (aggregated across all configured units) */}
        <section aria-labelledby="facility-stats-heading">
          <h2 id="facility-stats-heading" className="text-lg font-semibold text-gray-900 mb-3">
            Facility overview
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Totals are calculated from every unit that is set up in this facility (patient and staff records per
            unit).
          </p>
          {statsLoading || !facilityStats ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              Loading facility statistics…
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border-blue-100 bg-gradient-to-br from-blue-50/80 to-white">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Layout className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Units</span>
                  </div>
                  <CardTitle className="text-2xl tabular-nums">{facilityStats.unitCount}</CardTitle>
                  <CardDescription className="text-xs">With saved layouts</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <BedDouble className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Beds</span>
                  </div>
                  <CardTitle className="text-2xl tabular-nums">
                    {facilityStats.occupiedBeds}
                    <span className="text-base font-normal text-gray-500">
                      {' '}
                      / {facilityStats.totalBeds}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">Occupied / total</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-amber-100 bg-gradient-to-br from-amber-50/80 to-white">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <ArrowRightLeft className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">ADT quick look</span>
                  </div>
                  <CardTitle className="text-xl tabular-nums">
                    A {facilityStats.adtAdmissions} · D {facilityStats.adtDischargesDueToday} · T {facilityStats.adtTransfersFlagged}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Admissions (active), discharges due today, and transfer-flagged patients
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-violet-100 bg-gradient-to-br from-violet-50/80 to-white">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-2 text-violet-700">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Staff</span>
                  </div>
                  <CardTitle className="text-2xl tabular-nums">
                    {facilityStats.totalNurses + facilityStats.totalTechs}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {facilityStats.totalNurses} nurses · {facilityStats.totalTechs} techs
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}
          {!statsLoading && facilityStats && facilityStats.unitCount > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <Card>
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 text-orange-800">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Fall risk (occupied)</p>
                    <p className="text-2xl font-semibold tabular-nums">{facilityStats.patientsFallRisk}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-100 text-sky-900">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Isolation (occupied)</p>
                    <p className="text-2xl font-semibold tabular-nums">{facilityStats.patientsIsolation}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* Unit selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Layout className="w-5 h-5 mr-2" />
              Select unit
            </CardTitle>
            <CardDescription>
              All units configured for this facility are listed below. Your last opened unit appears first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="unit-select">Available units</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger id="unit-select" className="mt-1">
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {sortedUnits.map((unit) => {
                    const isLastOpened = lastOpenedName === unit.name;
                    return (
                      <SelectItem key={unit.id} value={unit.name}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`w-3 h-3 rounded-full shrink-0 ${getThemeColor(unit.theme).split(' ')[0]}`} />
                          <span>{unit.name}</span>
                          {isLastOpened && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                              Last opened
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleEnterUnit} disabled={!selectedUnit} className="flex-1 min-w-[140px]">
                Enter unit
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>

              <Button variant="outline" onClick={() => setIsCreateUnitOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New unit
              </Button>
              <CreateUnitDialog
                open={isCreateUnitOpen}
                onOpenChange={setIsCreateUnitOpen}
                onSave={handleCreateUnitWizard}
                existingLayoutNames={availableLayoutNames}
              />
            </div>

            {sortedUnits.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Units</h4>
                <div className="space-y-2 max-h-[min(360px,50vh)] overflow-y-auto pr-1">
                  {sortedUnits.map((unit) => {
                    const isLastOpened = lastOpenedName === unit.name;
                    return (
                      <ContextMenu key={unit.id}>
                        <ContextMenuTrigger asChild>
                          <div
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedUnit(unit.name);
                              }
                            }}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                              selectedUnit === unit.name
                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                                : 'border-gray-200'
                            } ${isLastOpened ? 'shadow-sm' : ''}`}
                            onClick={() => setSelectedUnit(unit.name)}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`w-3 h-3 rounded-full shrink-0 ${getThemeColor(unit.theme).split(' ')[0]}`}
                                />
                                <span className="font-medium truncate">{unit.name}</span>
                                {isLastOpened && (
                                  <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 shrink-0">
                                    Last opened
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center text-sm text-gray-500 shrink-0">
                                {getThemeIcon(unit.theme)}
                                <span className="ml-1 capitalize">{unit.theme}</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Created {new Date(unit.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => handleOpenEditUnit(unit)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit unit
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <EditUnitDialog
        open={isEditUnitOpen}
        onOpenChange={(open) => {
          setIsEditUnitOpen(open);
          if (!open) setUnitToEdit(null);
        }}
        initialValues={unitToEdit ? { name: unitToEdit.name, theme: unitToEdit.theme } : null}
        existingLayoutNames={availableLayoutNames}
        onSave={handleSaveEditedUnit}
      />
    </div>
  );
}
