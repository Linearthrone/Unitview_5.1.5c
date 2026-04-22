"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// UI Components
import AppHeader from './app-header';
import ShiftMakerDialog from './shift-maker-dialog';
import PatientGrid from './patient-grid';
import ReportSheet from './report-sheet';
import PrintableReport from './printable-report';
import PrintableAssignments from './printable-assignments';
import SaveLayoutDialog from './save-layout-dialog';
import AdmitPatientDialog from './admit-patient-dialog';
import DischargeConfirmationDialog from './discharge-confirmation-dialog';
import AddStaffMemberDialog from './add-staff-member-dialog';
import AssignStaffDialog from './assign-staff-dialog';
import ManageSpectraDialog from './manage-spectra-dialog';
import SpectralinkDeviceTable from './spectralink-device-table';
import AddRoomDialog from './add-room-dialog';
import CreateUnitDialog from './create-unit-dialog';
import EditRoomDesignationDialog from './edit-room-designation-dialog';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
// Hooks and utils
import { useToast } from "../hooks/use-toast";
import { NUM_ROWS_GRID } from '../lib/grid-utils';
import { computeNameAlertGroups } from '@/lib/name-alerts';
import {
  isOccupiedBed,
  patientHasInvoluntaryHoldKeywords,
  countPatientsWithSitterNurse,
} from '@/lib/patient-status-helpers';
// Types
import type { LayoutName, Patient, StaffRole, CreateUnitPayload } from '../types/patient';
import type { Nurse, PatientCareTech, Spectra, SpectraStatus } from '../types/nurse';
import type { AdmitPatientFormValues } from '../types/forms';
import type { AddStaffMemberFormValues } from '../types/forms';
import type { User } from '../types/auth';
// Services
import * as layoutService from '../services/layoutService';
import * as patientService from '../services/patientService';
import * as nurseService from '../services/nurseService';
import * as spectraService from '../services/spectraService';
import * as assignmentService from '../services/assignmentService';
import { getDb } from '../lib/database-simple';
import { syncPatientsAssignedNurseFromNurses } from '../lib/nurse-assignment-sync';
import { findCompactEmptySlot, getAvailableSpectra } from '../services/nurseHelpers';


interface DraggingPatientInfo {
  id: string;
  originalGridRow: number;
  originalGridColumn: number;
}
interface DraggingNurseInfo {
  id: string;
}
interface DraggingTechInfo {
  id: string;
}

interface UnitViewClientProps {
    initialLayoutName: LayoutName;
    initialAvailableLayouts: LayoutName[];
    initialIsLayoutLocked: boolean;
    initialPatients: Patient[];
    initialNurses: Nurse[];
    initialTechs: PatientCareTech[];
    initialSpectraPool: Spectra[];
    onBackToDashboard?: () => void;
    currentUser?: User;
}

const getFriendlyLayoutName = (layoutName: LayoutName): string => {
    switch (layoutName) {
      case 'North-South View': return 'North/South View';
      default: return layoutName;
    }
  };

export default function UnitViewClient({
    initialLayoutName,
    initialAvailableLayouts,
    initialIsLayoutLocked,
    initialPatients,
    initialNurses,
    initialTechs,
    initialSpectraPool,
    onBackToDashboard,
    currentUser: _currentUser
}: UnitViewClientProps) {
  const [isLayoutLocked, setIsLayoutLocked] = useState(initialIsLayoutLocked);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [currentLayoutName, setCurrentLayoutName] = useState<LayoutName>(initialLayoutName);
  const [availableLayouts] = useState<LayoutName[]>(initialAvailableLayouts);

  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [nurses, setNurses] = useState<Nurse[]>(initialNurses);
  const [techs, setTechs] = useState<PatientCareTech[]>(initialTechs);
  const [spectraPool, setSpectraPool] = useState<Spectra[]>(initialSpectraPool);
  /** Draft shift (isolated from active board until activation). */
  const [oncomingNurses, setOncomingNurses] = useState<Nurse[]>([]);
  
  const [draggingPatientInfo, setDraggingPatientInfo] = useState<DraggingPatientInfo | null>(null);
  const [draggingNurseInfo, setDraggingNurseInfo] = useState<DraggingNurseInfo | null>(null);
  const [draggingTechInfo, setDraggingTechInfo] = useState<DraggingTechInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(true); // Initialized on server
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();
  
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [admitOrUpdatePatient, setAdmitOrUpdatePatient] = useState<Patient | null>(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isAddStaffMemberDialogOpen, setIsAddStaffMemberDialogOpen] = useState(false);
  const [quickAddRole, setQuickAddRole] = useState<StaffRole>('Staff Nurse');
  const [isAssignStaffDialogOpen, setIsAssignStaffDialogOpen] = useState(false);
  const [staffRoleToAssign, setStaffRoleToAssign] = useState<StaffRole | null>(null);
  const [isManageSpectraDialogOpen, setIsManageSpectraDialogOpen] = useState(false);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [isCreateUnitDialogOpen, setIsCreateUnitDialogOpen] = useState(false);
  const [isShiftMakerOpen, setIsShiftMakerOpen] = useState(false);
  const [isOncomingShiftSetup, setIsOncomingShiftSetup] = useState(false);
  const [patientToDischarge, setPatientToDischarge] = useState<Patient | null>(null);
  const [patientToEditDesignation, setPatientToEditDesignation] = useState<Patient | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rows = await nurseService.getOncomingNurses(currentLayoutName);
      if (!cancelled) setOncomingNurses(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentLayoutName]);

  const handleImportData = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.importData();
      if (!result.success || !result.data) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: result.error ?? 'Unable to import data.',
        });
        return;
      }

      const database = await getDb();
      database.importData(result.data as ReturnType<typeof database.exportData>);
      toast({
        title: 'Import Complete',
        description: 'Data imported successfully. Reloading…',
      });
      window.location.href = '/';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error while importing data.';
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: message,
      });
    }
  }, [toast]);

  const handleExportData = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const database = await getDb();
      const result = await window.electronAPI.exportData(database.exportData());
      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description: result.error ?? 'Unable to export data.',
        });
        return;
      }

      toast({
        title: 'Export Complete',
        description: result.path ? `Backup saved to ${result.path}` : 'Backup saved successfully.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error while exporting data.';
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: message,
      });
    }
  }, [toast]);

  const handlePrintReport = useCallback(() => {
    handlePrint('charge');
  }, []);

  // Electron API integration
  useEffect(() => {
    if (window.electronAPI) {
      const handleMenuAction = (action: string) => {
        switch (action) {
          case 'new-layout':
            setIsCreateUnitDialogOpen(true);
            break;
          case 'open-layout':
            // Trigger layout switcher
            break;
          case 'save-layout':
            setIsSaveDialogOpen(true);
            break;
          case 'import-data':
            handleImportData();
            break;
          case 'export-data':
            handleExportData();
            break;
          case 'print-report':
            handlePrintReport();
            break;
        }
      };

      const unsubscribe = window.electronAPI.onMenuAction(handleMenuAction);

      return () => {
        unsubscribe();
      };
    }
  }, [handleExportData, handleImportData, handlePrintReport]);

  const getChargeNurseName = () => {
    return nurses.find(n => n.role === 'Charge Nurse')?.name || 'Unassigned';
  }

  const _loadLayoutData = useCallback(async (layoutName: LayoutName) => {
      setIsInitialized(false);
      try {
        const [patientData, nurseData, techData] = await Promise.all([
            patientService.getPatients(layoutName),
            nurseService.getNurses(layoutName),
            nurseService.getTechs(layoutName),
        ]);

        setPatients(patientData);
        setNurses(nurseData);
        setTechs(techData);

        setCurrentLayoutName(layoutName);
      } catch (error) {
        console.error(`Failed to load data for layout "${layoutName}":`, error);
        toast({
          variant: "destructive",
          title: "Error Loading Layout",
          description: `Could not load data for "${layoutName}".`,
        });
      } finally {
        setIsInitialized(true);
      }
  }, [toast]);

  // Set current year on mount
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleSelectLayout = async (newLayoutName: LayoutName) => {
    await layoutService.setUserPreference('lastSelectedLayout', newLayoutName);
    window.location.href = '/'; // Reload to get server-rendered props for new layout
  };

  const toggleLayoutLock = () => {
    const newLockState = !isLayoutLocked;
    setIsLayoutLocked(newLockState);
    layoutService.setUserPreference('isLayoutLocked', newLockState);
  };
  
  const handleOpenSaveDialog = () => {
    if (isLayoutLocked) {
      toast({
        variant: "destructive",
        title: "Layout Locked",
        description: "Unlock the layout to save changes.",
      });
      return;
    }
    setIsSaveDialogOpen(true);
  };
  
  const handleSaveNewLayout = async (newLayoutName: string) => {
    await layoutService.saveNewLayout(newLayoutName, patients, nurses, techs);
    await layoutService.setUserPreference('lastSelectedLayout', newLayoutName);
    
    toast({
      title: "Layout Saved",
      description: `Layout "${newLayoutName}" has been successfully saved. Reloading...`,
    });
    // Hard reload to get new server props
    window.location.href = '/';
  };

  const handleSaveCurrentLayout = async () => {
    if (isLayoutLocked) {
      toast({
        variant: "destructive",
        title: "Layout Locked",
        description: "Unlock the layout to save changes.",
      });
      return;
    }
    await layoutService.saveNewLayout(currentLayoutName, patients, nurses, techs);
    toast({
      title: "Layout Saved",
      description: `Current layout "${currentLayoutName}" has been saved.`,
    });
  };

  const handleSaveAssignments = async () => {
    try {
      const chargeNurseName = getChargeNurseName();
      const archivingOncoming = isOncomingShiftSetup;
      const nursesForArchive = archivingOncoming ? oncomingNurses : nurses;
      await assignmentService.saveShiftAssignments(currentLayoutName, nursesForArchive, patients, chargeNurseName);
      setIsOncomingShiftSetup(false);
      toast({
        title: "Assignments Saved",
        description: archivingOncoming
          ? "Oncoming shift assignment snapshot saved for reference."
          : "The current shift assignments have been saved for reference.",
      });
    } catch (error) {
       console.error("Failed to save assignments:", error);
       toast({
          variant: "destructive",
          title: "Error Saving Assignments",
          description: "Could not save the current assignments. See console for details.",
       });
    }
  };

  const handleSetupOncomingShift = async () => {
    let draft = await nurseService.getOncomingNurses(currentLayoutName);
    if (draft.length === 0) {
      draft = JSON.parse(JSON.stringify(nurses)) as Nurse[];
      await nurseService.saveOncomingNurses(currentLayoutName, draft);
    }
    setOncomingNurses(draft);
    setIsOncomingShiftSetup(true);
    setIsShiftMakerOpen(true);
    toast({
      title: 'Oncoming shift',
      description:
        'Edit the oncoming board here. The active unit map is unchanged until you activate this shift.',
    });
  };

  const handleActivateOncomingShift = async () => {
    try {
      await nurseService.saveOncomingNurses(currentLayoutName, oncomingNurses);
      await nurseService.activateOncomingShift(currentLayoutName);
      const promoted = await nurseService.getNurses(currentLayoutName);
      setNurses(promoted);
      setPatients((prev) => syncPatientsAssignedNurseFromNurses(prev, promoted));
      const cleared = await nurseService.getOncomingNurses(currentLayoutName);
      setOncomingNurses(cleared);
      setIsOncomingShiftSetup(false);
      setIsShiftMakerOpen(false);
      toast({
        title: 'Shift activated',
        description: 'Oncoming shift is now active. Previous active nurse cards were replaced.',
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Activation failed',
        description: e instanceof Error ? e.message : 'Could not activate shift.',
      });
    }
  };

  const handleOncomingDropOnNurseSlot = useCallback(
    (targetNurseId: string, _slotIndex: number) => {
      if (!draggingPatientInfo) return;
      const draggedPatientId = draggingPatientInfo.id;

      setOncomingNurses((currentOncoming) => {
        const draggedPatient = patients.find((p) => p.id === draggedPatientId);
        const targetNurse = currentOncoming.find((n) => n.id === targetNurseId);
        if (!draggedPatient || !targetNurse) return currentOncoming;

        const nurseCapacity = Math.max(1, targetNurse.assignedPatientIds.length);

        let next = currentOncoming.map((nurse) => ({
          ...nurse,
          assignedPatientIds: nurse.assignedPatientIds.map((id) => (id === draggedPatientId ? null : id)),
        }));

        const tn = next.find((n) => n.id === targetNurseId);
        if (!tn) return currentOncoming;

        const currentAssignedIds = tn.assignedPatientIds.filter((id) => id !== null && id !== draggedPatientId);
        const merged = [...currentAssignedIds, draggedPatientId];
        const patientMap = new Map(patients.map((p) => [p.id, p]));
        const sortedPatientIds = merged.sort((idA, idB) => {
          const pa = patientMap.get(idA!);
          const pb = patientMap.get(idB!);
          if (!pa || !pb) return 0;
          return pa.bedNumber - pb.bedNumber;
        });

        const finalPaddedIds = Array.from({ length: nurseCapacity }, () => null as string | null);
        sortedPatientIds.forEach((id, index) => {
          if (index < nurseCapacity && id) finalPaddedIds[index] = id;
        });

        next = next.map((nurse) =>
          nurse.id === targetNurseId ? { ...nurse, assignedPatientIds: finalPaddedIds } : nurse,
        );
        return next;
      });

      setDraggingPatientInfo(null);
    },
    [draggingPatientInfo, patients],
  );

  const handleOncomingClearNurseAssignments = useCallback((nurseId: string) => {
    setOncomingNurses((prev) =>
      prev.map((n) =>
        n.id === nurseId
          ? {
              ...n,
              assignedPatientIds: Array(Math.max(1, n.assignedPatientIds.length)).fill(null) as (string | null)[],
            }
          : n,
      ),
    );
  }, []);

  const handleOncomingRemoveNurse = useCallback((nurseId: string) => {
    let removedName = '';
    setOncomingNurses((prev) => {
      const removed = prev.find((n) => n.id === nurseId);
      removedName = removed?.name ?? '';
      return prev.filter((n) => n.id !== nurseId);
    });
    toast({
      title: 'Removed from oncoming shift',
      description: removedName ? `${removedName} removed from the oncoming draft.` : 'Card removed.',
    });
  }, [toast]);

  const handleOncomingAddNurseCard = useCallback(async () => {
    try {
      const metadata = await layoutService.getLayoutMetadata(currentLayoutName);
      const nurseCapacity = Math.max(1, metadata.nurseToPatientRatio);
      const slot = findCompactEmptySlot(patients, [...nurses, ...oncomingNurses], techs, 3, 1);
      if (!slot) {
        toast({
          variant: 'destructive',
          title: 'No empty space',
          description: 'Cannot place another nurse card on the grid.',
        });
        return;
      }
      const availableSpectra = getAvailableSpectra(spectraPool, [...nurses, ...oncomingNurses], techs);
      const newNurse: Nurse = {
        id: `staff-nurse-oncoming-${Date.now()}`,
        name: 'New Staff Nurse',
        role: 'Staff Nurse',
        spectra: availableSpectra[0]?.id ?? '',
        relief: '',
        assignedPatientIds: Array(nurseCapacity).fill(null) as (string | null)[],
        gridRow: slot.row,
        gridColumn: slot.col,
      };
      setOncomingNurses((prev) => [...prev, newNurse]);
      toast({ title: 'Card added', description: 'Staff nurse card added to oncoming shift draft.' });
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e instanceof Error ? e.message : 'Could not add card.',
      });
    }
  }, [currentLayoutName, nurses, oncomingNurses, patients, spectraPool, techs, toast]);

  const handleOncomingAssignSpectra = async (deviceId: string, staffName: string) => {
    const result = await spectraService.assignDeviceToStaff(deviceId, staffName, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      setOncomingNurses((prev) =>
        prev.map((n) => (n.name.trim() === staffName.trim() ? { ...n, spectra: deviceId } : n)),
      );
      toast({ title: 'Device Assigned', description: `${deviceId} assigned to ${staffName} (oncoming).` });
    } else if (result.error) {
      toast({ variant: 'destructive', title: 'Unable to Assign Device', description: result.error });
    }
  };

  const handleOncomingUnassignSpectra = async (deviceId: string) => {
    const result = await spectraService.unassignDevice(deviceId, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      setOncomingNurses((prev) =>
        prev.map((n) => (n.spectra === deviceId ? { ...n, spectra: '' } : n)),
      );
      toast({ title: 'Device Unassigned', description: `${deviceId} is now unassigned.` });
    } else if (result.error) {
      toast({ variant: 'destructive', title: 'Unable to Unassign Device', description: result.error });
    }
  };


  const handleOpenAdmitDialog = (patient: Patient | null) => {
    setIsUpdateMode(false);
    setAdmitOrUpdatePatient(patient);
  };

  const handleOpenUpdateDialog = (patient: Patient) => {
    setIsUpdateMode(true);
    setAdmitOrUpdatePatient(patient);
  };

  const handleSavePatient = async (formData: AdmitPatientFormValues) => {
    const updatedPatients = await patientService.admitPatient(formData, patients);
    setPatients(updatedPatients);
    setAdmitOrUpdatePatient(null);
    
    const verb = isUpdateMode ? 'updated' : 'admitted';
    const patientRecord = updatedPatients.find(p => p.bedNumber === formData.bedNumber);
    toast({
      title: `Patient ${verb.charAt(0).toUpperCase() + verb.slice(1)}`,
      description: `${formData.name} has been ${verb} to ${patientRecord?.roomDesignation}.`,
    });
  };

  const handleDischargeRequest = (patient: Patient) => {
    if (patient.name === 'Vacant') return;
    setPatientToDischarge(patient);
  };
  
  const handleConfirmDischarge = async () => {
    if (!patientToDischarge) return;
    const updatedPatients = await patientService.dischargePatient(patientToDischarge, patients);
    setPatients(updatedPatients);
    toast({
      title: "Patient Discharged",
      description: `${patientToDischarge.name} has been discharged from ${patientToDischarge.roomDesignation}.`,
    });
    setPatientToDischarge(null);
    setSelectedPatient(null);
  };

  const handleToggleBlockRoom = (patientId: string) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, isBlocked: !p.isBlocked } : p
    ));
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        toast({
            title: `Room ${!patient.isBlocked ? "Blocked" : "Unblocked"}`,
            description: `${patient.roomDesignation} is now ${!patient.isBlocked ? "out of service" : "in service"}.`,
        });
    }
  };

  const handleDeleteRoom = (patientId: string) => {
    if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      // Remove the patient from local state
      setPatients(prev => prev.filter(p => p.id !== patientId));
      
      // Remove from database
      patientService.deletePatient(patientId);
      
      // Show success message
      toast({
        title: 'Room Deleted',
        description: 'The room has been successfully removed from the unit.',
      });
    }
  };
  
  const handleSaveRoomDesignation = (patientId: string, newDesignation: string) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, roomDesignation: newDesignation } : p
    ));
    setPatientToEditDesignation(null);
    toast({
      title: "Room Designation Updated",
      description: `Room has been renamed to "${newDesignation}".`,
    });
  };

  
  const handleSaveStaffMember = async (formData: AddStaffMemberFormValues) => {
    try {
      const result = await nurseService.addStaffMember(
        currentLayoutName,
        formData,
        nurses,
        techs,
        patients,
        spectraPool
      );

      setIsAddStaffMemberDialogOpen(false);

      if (result.nurses) {
        setNurses(result.nurses);
        toast({ title: "Staff Added", description: `${formData.name} (${formData.role}) has been added to the unit.` });
      }
      if (result.techs) {
        setTechs(result.techs);
        toast({ title: "Tech Added", description: `${formData.name} (${formData.role}) has been added to the unit.` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add staff member.";
      toast({
        variant: "destructive",
        title: "Error Adding Staff",
        description: message,
      });
    }
  };

  const handleRemoveNurse = (nurseId: string) => {
    const nurseToRemove = nurses.find(n => n.id === nurseId);
    if (!nurseToRemove) return;

    // Unassign patients from the nurse being removed
    const patientIdsToUnassign = nurseToRemove.assignedPatientIds.filter(id => id !== null);
    setPatients(prevPatients =>
      prevPatients.map(p =>
        patientIdsToUnassign.includes(p.id) ? { ...p, assignedNurse: undefined } : p
      )
    );

    setNurses(prevNurses => prevNurses.filter(n => n.id !== nurseId));
    toast({
      title: "Staff Removed",
      description: `${nurseToRemove.name} has been removed from the unit.`,
    });
  };

  const handleRemoveTech = (techId: string) => {
    const techToRemove = techs.find(t => t.id === techId);
    if (!techToRemove) return;

    setTechs(prevTechs => prevTechs.filter(t => t.id !== techId));
    toast({
      title: "Tech Removed",
      description: `${techToRemove.name} has been removed from the unit.`,
    });
  };

  const handleAssignStaff = (role: StaffRole) => {
    setStaffRoleToAssign(role);
    setIsAssignStaffDialogOpen(true);
  }

  const handleQuickAddStaff = (role: StaffRole) => {
    setQuickAddRole(role);
    setIsAddStaffMemberDialogOpen(true);
  };

  const handleSaveAssignedStaff = (name: string, role: StaffRole) => {
      setNurses(prev => prev.map(n => n.role === role ? { ...n, name } : n));
      toast({ title: "Staff Assigned", description: `${name} has been assigned as the ${role}.` });
      setIsAssignStaffDialogOpen(false);
  }

  const handleRemoveStaff = (role: StaffRole) => {
    setNurses(prev => prev.map(n => {
      if (n.role === role) {
        return { ...n, name: 'Unassigned' };
      }
      return n;
    }));
    toast({ title: "Staff Removed", description: `The ${role} has been unassigned.` });
  };
  
  const handleAddSpectra = async (newId: string) => {
    const result = await spectraService.addSpectra(newId, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      toast({ title: "Spectra Added", description: `Device ${newId.trim().toUpperCase()} added to the pool.` });
    } else if (result.error) {
      toast({ variant: "destructive", title: "Error Adding Spectra", description: result.error });
    }
  };
  
  const handleToggleSpectraStatus = async (id: string, inService: boolean) => {
    const result = await spectraService.toggleSpectraStatus(id, inService, spectraPool, [...nurses, ...oncomingNurses], techs);
    if (result.newPool) {
        setSpectraPool(result.newPool);
    } else if (result.error) {
        toast({ variant: "destructive", title: "Cannot Disable", description: result.error });
    }
  };

  const handleSetSpectraStatus = async (id: string, status: SpectraStatus) => {
    const result = await spectraService.updateDeviceStatus(id, status, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      toast({ title: 'Device Updated', description: `${id} set to ${status}.` });
    } else if (result.error) {
      toast({ variant: 'destructive', title: 'Unable to Update Device', description: result.error });
    }
  };

  const handleAssignSpectraToStaff = async (id: string, staffName: string) => {
    const result = await spectraService.assignDeviceToStaff(id, staffName, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      toast({ title: 'Device Assigned', description: `${id} assigned to ${staffName}.` });
    } else if (result.error) {
      toast({ variant: 'destructive', title: 'Unable to Assign Device', description: result.error });
    }
  };

  const handleUnassignSpectra = async (id: string) => {
    const result = await spectraService.unassignDevice(id, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      toast({ title: 'Device Unassigned', description: `${id} is now unassigned.` });
    } else if (result.error) {
      toast({ variant: 'destructive', title: 'Unable to Unassign Device', description: result.error });
    }
  };

  const handleAddSpectraLog = async (id: string, message: string) => {
    const result = await spectraService.addDeviceLog(id, message, spectraPool);
    if (result.newPool) {
      setSpectraPool(result.newPool);
      toast({ title: 'Log Added', description: `Log saved for ${id}.` });
    } else if (result.error) {
      toast({ variant: 'destructive', title: 'Unable to Save Log', description: result.error });
    }
  };

  const handleCreateRoom = async (designation: string) => {
    const result = await patientService.createRoom(designation, patients, nurses, techs);
    if (result.newPatients) {
      setPatients(result.newPatients);
      setIsAddRoomDialogOpen(false);
      toast({
        title: "Room Created",
        description: `Room "${designation}" has been added to the grid.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Could Not Create Room",
        description: result.error,
      });
    }
  };

  const handleCreateUnit = async (data: CreateUnitPayload) => {
    try {
        await layoutService.createFullUnitFromPayload(data);
        toast({
            title: "Unit Created",
            description: `Unit "${data.designation}" has been created. Reloading...`,
        });
        window.location.href = '/';
    } catch (error) {
        console.error("Failed to create new unit:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({
            variant: "destructive",
            title: "Error Creating Unit",
            description: errorMessage,
        });
        throw error;
    }
  };

  const handleInsertMockData = async () => {
    const { updatedPatients, insertedCount } = await patientService.insertMockPatients(patients);
    if (insertedCount > 0) {
      setPatients(updatedPatients);
      toast({
        title: "Mock Data Inserted",
        description: `${insertedCount} mock patients have been added to vacant rooms.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "No Vacant Rooms",
        description: "Could not insert mock data because there are no available vacant rooms.",
      });
    }
  };

  const handlePrint = (reportType: 'charge' | 'assignments') => {
    const printTarget = reportType === 'charge' ? 'printable-charge-report' : 'printable-assignments-report';
    const content = document.getElementById(printTarget);
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const bodyHtml = content.innerHTML.replace(/<\/script/gi, '<\\/script');
    printWindow.document.write(`
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Print Report</title>
          <style>
              body { margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #000; }
              #printable-assignments-report,
              #printable-charge-report {
                display: block !important;
                position: static !important;
                left: auto !important;
                top: auto !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                overflow: visible !important;
                opacity: 1 !important;
              }
              .uv-print-assignments-layout {
                display: grid !important;
                grid-template-columns: 1fr 18rem;
                gap: 12px;
                align-items: start;
              }
              .uv-print-nurse-row { display: grid !important; gap: 8px; }
              .uv-print-pct-row { display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
              @media print {
                  body { font-size: 10pt; }
                  .print-hide { display: none !important; }
                  .page-break-inside-avoid { page-break-inside: avoid; }
                  h1 { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 0.5rem; }
                  .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; font-size: 9pt; }
                  .report-header .unit-name { font-size: 20pt; font-weight: bold; text-align: center; width: 100%; position: absolute; top: 0; left: 0; }
              }
          </style>
          <link rel="stylesheet" href="/globals.css">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${bodyHtml}
          <script>
            setTimeout(function () {
              window.focus();
              window.print();
              window.close();
            }, 400);
          </script>
        </body>
        </html>
    `);
    printWindow.document.close();
  };
  
  const handlePatientDragStart = useCallback((
    e: React.DragEvent<HTMLDivElement>,
    patientId: string,
    originalGridRow: number,
    originalGridColumn: number
  ) => {
    if (isLayoutLocked) {
      e.preventDefault();
      return;
    }
    setDraggingNurseInfo(null);
    setDraggingTechInfo(null);
    setDraggingPatientInfo({ id: patientId, originalGridRow, originalGridColumn });
    e.dataTransfer.setData('text/plain', patientId);
    e.dataTransfer.effectAllowed = 'move';
  }, [isLayoutLocked]);
  
  const handleNurseDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, nurseId: string) => {
    if (isLayoutLocked) {
      e.preventDefault();
      return;
    }
    setDraggingPatientInfo(null);
    setDraggingTechInfo(null);
    setDraggingNurseInfo({ id: nurseId });
    e.dataTransfer.setData('text/plain', nurseId);
    e.dataTransfer.effectAllowed = 'move';
  }, [isLayoutLocked]);

  const handleTechDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, techId: string) => {
    if (isLayoutLocked) {
      e.preventDefault();
      return;
    }
    setDraggingPatientInfo(null);
    setDraggingNurseInfo(null);
    setDraggingTechInfo({ id: techId });
    e.dataTransfer.setData('text/plain', techId);
    e.dataTransfer.effectAllowed = 'move';
  }, [isLayoutLocked]);


  const handleDropOnCell = useCallback((targetRow: number, targetCol: number) => {
    if (isLayoutLocked) return;

    if (draggingPatientInfo) {
        const { id: draggedPatientId, originalGridRow, originalGridColumn } = draggingPatientInfo;
        setPatients(prevPatients => {
            const newPatients = prevPatients.map(p => ({...p}));
            const draggedPatient = newPatients.find(p => p.id === draggedPatientId);
            if (!draggedPatient) return prevPatients;

            const patientInTargetCell = newPatients.find(p => p.gridRow === targetRow && p.gridColumn === targetCol && p.id !== draggedPatientId);
            
            // Update positions
            draggedPatient.gridRow = targetRow;
            draggedPatient.gridColumn = targetCol;

            if (patientInTargetCell) {
                patientInTargetCell.gridRow = originalGridRow;
                patientInTargetCell.gridColumn = originalGridColumn;
            }

            // Save to database
            patientService.savePatients(currentLayoutName, newPatients);
            
            return newPatients;
        });
    }

    if (draggingNurseInfo) {
      const { id: draggedNurseId } = draggingNurseInfo;
      setNurses(prevNurses => {
        const newNurses = prevNurses.map(n => ({ ...n }));
        const draggedNurse = newNurses.find(n => n.id === draggedNurseId);
        if (!draggedNurse) return prevNurses;
        
        const cardHeight = (draggedNurse.role === 'Staff Nurse') ? 3 : 1;
        const newRow = Math.min(targetRow, NUM_ROWS_GRID - (cardHeight - 1)); 

        const targetCells = [];
        for (let i=0; i < cardHeight; i++) {
            targetCells.push(`${newRow + i}-${targetCol}`);
        }

        const isOccupiedByPatient = patients.some(p => targetCells.includes(`${p.gridRow}-${p.gridColumn}`));
        const isOccupiedByOtherNurse = newNurses.some(nurse => {
          if (nurse.id === draggedNurseId) return false;
          if (nurse.gridColumn !== targetCol) return false;
          
          const otherCardHeight = (nurse.role === 'Staff Nurse') ? 3 : 1;
          const otherTop = nurse.gridRow;
          const otherBottom = nurse.gridRow + otherCardHeight -1;

          return newRow <= otherBottom && (newRow + cardHeight -1) >= otherTop;
        });

        if (isOccupiedByPatient || isOccupiedByOtherNurse) {
          toast({ variant: "destructive", title: "Cannot Move Staff", description: "The target location is occupied." });
          return prevNurses;
        }

        draggedNurse.gridRow = newRow;
        draggedNurse.gridColumn = targetCol;
        
        // Save to database
        nurseService.saveNurses(currentLayoutName, newNurses);
        
        return newNurses;
      });
    }

    if (draggingTechInfo) {
        const { id: draggedTechId } = draggingTechInfo;
        setTechs(prevTechs => {
            const newTechs = prevTechs.map(t => ({...t}));
            const draggedTech = newTechs.find(t => t.id === draggedTechId);
            if (!draggedTech) return prevTechs;

            // Check for conflicts
            const isOccupiedByPatient = patients.some(p => p.gridRow === targetRow && p.gridColumn === targetCol);
            if (isOccupiedByPatient) {
                toast({ variant: "destructive", title: "Cannot Move Tech", description: "The target location is occupied by a patient." });
                return prevTechs;
            }
    
            draggedTech.gridRow = targetRow;
            draggedTech.gridColumn = targetCol;
            
            // Save to database
            nurseService.saveTechs(currentLayoutName, newTechs);
            
            return newTechs;
        });
    }
    setDraggingPatientInfo(null);
    setDraggingNurseInfo(null);
    setDraggingTechInfo(null);
  }, [draggingPatientInfo, draggingNurseInfo, draggingTechInfo, isLayoutLocked, patients, toast, currentLayoutName]);
  
  const handleDragEnd = useCallback(() => {
    setDraggingPatientInfo(null);
    setDraggingNurseInfo(null);
    setDraggingTechInfo(null);
  }, []);

  const handleAutoSave = useCallback(async () => {
    if (isLayoutLocked || !isInitialized) return;
    await Promise.all([
      patientService.savePatients(currentLayoutName, patients),
      nurseService.saveNurses(currentLayoutName, nurses),
      nurseService.saveOncomingNurses(currentLayoutName, oncomingNurses),
      nurseService.saveTechs(currentLayoutName, techs),
    ]);
  }, [patients, nurses, oncomingNurses, techs, isLayoutLocked, currentLayoutName, isInitialized]);

  const handleDropOnNurseSlot = useCallback((targetNurseId: string, _slotIndex: number) => {
    if (!draggingPatientInfo) return;
    const { id: draggedPatientId } = draggingPatientInfo;

    // Use functional updates to ensure we have the latest state
    setPatients(currentPatients => {
      setNurses(currentNurses => {
        const draggedPatient = currentPatients.find(p => p.id === draggedPatientId);
        const targetNurse = currentNurses.find(n => n.id === targetNurseId);

        if (!draggedPatient || !targetNurse) {
          return currentNurses; // No change if patient or nurse not found
        }
        
        // 1. Get the list of all patients currently assigned to the target nurse
        const currentAssignedIds = targetNurse.assignedPatientIds.filter(id => id !== null && id !== draggedPatientId);
        
        // 2. Add the newly dragged patient to this list
        const newAssignedIds = [...currentAssignedIds, draggedPatientId];

        // 3. Create a map of patients for easy lookup
        const patientMap = new Map(currentPatients.map(p => [p.id, p]));

        // 4. Sort the assigned IDs based on the patient's bed number
        const sortedPatientIds = newAssignedIds.sort((idA, idB) => {
          const patientA = patientMap.get(idA);
          const patientB = patientMap.get(idB);
          if (!patientA || !patientB) return 0;
          return patientA.bedNumber - patientB.bedNumber;
        });

        // 5. Pad the array with nulls to fill configured nurse capacity
        const nurseCapacity = Math.max(1, targetNurse.assignedPatientIds.length);
        const finalPaddedIds = Array(nurseCapacity).fill(null);
        sortedPatientIds.forEach((id, index) => {
          if (index < nurseCapacity) {
            finalPaddedIds[index] = id;
          }
        });

        // 6. Update all nurses: remove the dragged patient from any other nurse and update the target nurse
        const newNurses = currentNurses.map(nurse => {
          if (nurse.id === targetNurseId) {
            return { ...nurse, assignedPatientIds: finalPaddedIds };
          }
          // Remove the patient from any other nurse who might have had them assigned
          const updatedIds = nurse.assignedPatientIds.map(id => (id === draggedPatientId ? null : id));
          return { ...nurse, assignedPatientIds: updatedIds };
        });

        // 7. Update all patients to reflect their new nurse assignment
        const newPatients = currentPatients.map(p => {
          if (finalPaddedIds.includes(p.id)) {
            return { ...p, assignedNurse: targetNurse.name };
          }
          if (p.assignedNurse === targetNurse.name && !finalPaddedIds.includes(p.id)) {
            return { ...p, assignedNurse: undefined };
          }
          return p;
        });
        
        // Set the new state for patients first, then nurses
        setPatients(newPatients);
        return newNurses;
      });
      return currentPatients; // Return original patients for this updater, the inner one handles it
    });

    setDraggingPatientInfo(null);
  }, [draggingPatientInfo]);

  const handleClearNurseAssignments = useCallback((nurseId: string) => {
    let newPatients = [...patients];
    let newNurses = [...nurses];

    const nurseToClear = newNurses.find(n => n.id === nurseId);
    if (!nurseToClear) return;
    
    const patientIdsToClear = nurseToClear.assignedPatientIds.filter(id => id !== null);
    
    newPatients = newPatients.map(p => {
        if (patientIdsToClear.includes(p.id)) {
            return { ...p, assignedNurse: undefined };
        }
        return p;
    });

    newNurses = newNurses.map(n => {
        if (n.id === nurseId) {
            return { ...n, assignedPatientIds: Array(Math.max(1, n.assignedPatientIds.length)).fill(null) };
        }
        return n;
    });
    
    setNurses(newNurses);
    setPatients(newPatients);
  }, [patients, nurses]);


  useEffect(() => {
    if (isInitialized && !isLayoutLocked) {
      handleAutoSave();
    }
  }, [patients, nurses, oncomingNurses, techs, isInitialized, isLayoutLocked, handleAutoSave]);

  useEffect(() => {
    const admittedPatients = patients
      .filter((p) => isOccupiedBed(p.name) && !p.isBlocked)
      .sort((a, b) => a.bedNumber - b.bedNumber);

    const assignedTechs = techs.filter((tech) => {
      const normalizedName = tech.name.trim().toLowerCase();
      return normalizedName.length > 0 && normalizedName !== 'unassigned';
    });

    if (assignedTechs.length === 0) {
      const anyNonEmptyGroups = techs.some((tech) => (tech.assignmentGroup ?? '').trim().length > 0);
      if (anyNonEmptyGroups) {
        setTechs((prev) => prev.map((tech) => ({ ...tech, assignmentGroup: '' })));
      }
      return;
    }

    const totalPatients = admittedPatients.length;
    const baseLoad = Math.floor(totalPatients / assignedTechs.length);
    const remainder = totalPatients % assignedTechs.length;

    let cursor = 0;
    const nextGroupByTechId = new Map<string, string>();
    assignedTechs.forEach((tech, index) => {
      const groupSize = baseLoad + (index < remainder ? 1 : 0);
      const groupPatients = admittedPatients.slice(cursor, cursor + groupSize);
      cursor += groupSize;

      if (groupPatients.length === 0) {
        nextGroupByTechId.set(tech.id, '');
      } else {
        const firstRoom = groupPatients[0].roomDesignation;
        const lastRoom = groupPatients[groupPatients.length - 1].roomDesignation;
        nextGroupByTechId.set(tech.id, firstRoom === lastRoom ? firstRoom : `${firstRoom} - ${lastRoom}`);
      }
    });

    const needsUpdate = techs.some((tech) => {
      const nextGroup = nextGroupByTechId.get(tech.id) ?? '';
      return (tech.assignmentGroup ?? '') !== nextGroup;
    });

    if (!needsUpdate) return;

    setTechs((prev) =>
      prev.map((tech) => ({
        ...tech,
        assignmentGroup: nextGroupByTechId.get(tech.id) ?? '',
      }))
    );
  }, [patients, techs]);
    
  const activePatientCount = patients.filter(p => p.name !== 'Vacant').length;
  const totalRoomCount = patients.length;
  const dnrCount = patients.filter(p => p.isComfortCareDNR).length;
  const restraintCount = patients.filter(p => p.isInRestraints).length;
  const foleyCount = patients.filter(p => Array.isArray(p.ldas) && p.ldas.some(lda => lda.toLowerCase().includes('foley'))).length;
  const isolationCount = useMemo(
    () => patients.filter((p) => isOccupiedBed(p.name) && p.isIsolation).length,
    [patients]
  );
  const involuntaryHoldCount = useMemo(
    () => patients.filter((p) => isOccupiedBed(p.name) && patientHasInvoluntaryHoldKeywords(p)).length,
    [patients]
  );
  const sitterCount = useMemo(
    () => countPatientsWithSitterNurse(patients, nurses),
    [patients, nurses]
  );
  const nameAlertGroups = useMemo(() => computeNameAlertGroups(patients), [patients]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        title="UnitView"
        unitName={`${getFriendlyLayoutName(currentLayoutName)}${isOncomingShiftSetup ? ' (Oncoming shift setup)' : ''}`}
        activePatientCount={activePatientCount}
        totalRoomCount={totalRoomCount}
        isLayoutLocked={isLayoutLocked}
        dnrCount={dnrCount}
        restraintCount={restraintCount}
        foleyCount={foleyCount}
        isolationCount={isolationCount}
        sitterCount={sitterCount}
        involuntaryHoldCount={involuntaryHoldCount}
        nameAlertGroups={nameAlertGroups}
        onToggleLayoutLock={toggleLayoutLock}
        currentLayoutName={currentLayoutName}
        onSelectLayout={handleSelectLayout}
        availableLayouts={availableLayouts}
        onPrint={handlePrint}
        onSaveLayout={handleOpenSaveDialog}
        onSaveCurrentLayout={handleSaveCurrentLayout}
        onAdmitPatient={() => handleOpenAdmitDialog(null)}
        onAddStaffMember={() => setIsAddStaffMemberDialogOpen(true)}
        onManageSpectra={() => setIsManageSpectraDialogOpen(true)}
        onAddRoom={() => setIsAddRoomDialogOpen(true)}
        onInsertMockData={handleInsertMockData}
        onSaveAssignments={handleSaveAssignments}
        onSetupOncomingShift={handleSetupOncomingShift}
        onLeaveUnit={onBackToDashboard}
      />
      <main className="flex-grow flex flex-col overflow-auto print-hide">
        <div className="flex-grow flex items-stretch">
            <PatientGrid
              patients={patients}
              nurses={nurses}
              techs={techs}
              isInitialized={isInitialized}
              isEffectivelyLocked={isLayoutLocked}
              draggingPatientInfo={draggingPatientInfo}
              draggingNurseInfo={draggingNurseInfo}
              draggingTechInfo={draggingTechInfo}
              onSelectPatient={setSelectedPatient}
              onPatientDragStart={handlePatientDragStart}
              onNurseDragStart={handleNurseDragStart}
              onTechDragStart={handleTechDragStart}
              onDropOnCell={handleDropOnCell}
              handleDropOnNurseSlot={handleDropOnNurseSlot}
              onClearNurseAssignments={handleClearNurseAssignments}
              onDragEnd={handleDragEnd}
              onAdmitPatient={handleOpenAdmitDialog}
              onUpdatePatient={handleOpenUpdateDialog}
              onDischargePatient={handleDischargeRequest}
              onToggleBlockRoom={handleToggleBlockRoom}
              onEditDesignation={(patient) => setPatientToEditDesignation(patient)}
              onRemoveNurse={handleRemoveNurse}
              onDeleteRoom={handleDeleteRoom}
              onRemoveTech={handleRemoveTech}
              onAssignStaff={handleAssignStaff}
              onQuickAddStaff={handleQuickAddStaff}
              onRemoveStaff={handleRemoveStaff}
            />
        </div>
        <div className="border-t px-4 py-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAddStaff('Staff Nurse')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Nurse Card
          </Button>
        </div>
        <div className="border-t p-4">
          <SpectralinkDeviceTable
            title="Unit Spectralink Device Table"
            spectraPool={spectraPool}
            nurses={nurses}
            techs={techs}
            onAssignDevice={handleAssignSpectraToStaff}
            onUnassignDevice={handleUnassignSpectra}
            onSetStatus={handleSetSpectraStatus}
            onAddLog={handleAddSpectraLog}
          />
        </div>
      </main>
      <PrintableReport patients={patients} />
      <PrintableAssignments 
        unitName={getFriendlyLayoutName(currentLayoutName)}
        chargeNurseName={getChargeNurseName()}
        nurses={nurses}
        techs={techs}
        patients={patients}
      />
      <ReportSheet
        patient={selectedPatient}
        open={!!selectedPatient}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedPatient(null);
          }
        }}
        onDischarge={handleDischargeRequest}
      />
      <SaveLayoutDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSave={handleSaveNewLayout}
        existingLayoutNames={availableLayouts}
      />
      <AdmitPatientDialog
        open={!!admitOrUpdatePatient}
        onOpenChange={(isOpen) => !isOpen && setAdmitOrUpdatePatient(null)}
        onSave={handleSavePatient}
        patients={patients}
        nurses={nurses}
        patientToEdit={admitOrUpdatePatient}
        isUpdateMode={isUpdateMode}
      />
      <AddStaffMemberDialog
        open={isAddStaffMemberDialogOpen}
        onOpenChange={setIsAddStaffMemberDialogOpen}
        onSave={handleSaveStaffMember}
        spectraPool={spectraPool}
        nurses={nurses}
        techs={techs}
        initialRole={quickAddRole}
      />
       <AssignStaffDialog
        open={isAssignStaffDialogOpen}
        onOpenChange={() => setIsAssignStaffDialogOpen(false)}
        role={staffRoleToAssign}
        onSave={handleSaveAssignedStaff}
      />
      <AddRoomDialog
        open={isAddRoomDialogOpen}
        onOpenChange={setIsAddRoomDialogOpen}
        onSave={handleCreateRoom}
        existingDesignations={patients.map(p => p.roomDesignation)}
      />
      <CreateUnitDialog
        open={isCreateUnitDialogOpen}
        onOpenChange={setIsCreateUnitDialogOpen}
        onSave={handleCreateUnit}
        existingLayoutNames={availableLayouts}
      />
       <EditRoomDesignationDialog
        open={!!patientToEditDesignation}
        onOpenChange={(isOpen) => !isOpen && setPatientToEditDesignation(null)}
        patient={patientToEditDesignation}
        onSave={handleSaveRoomDesignation}
        existingDesignations={patients.map(p => p.roomDesignation)}
      />
      <ManageSpectraDialog
        open={isManageSpectraDialogOpen}
        onOpenChange={setIsManageSpectraDialogOpen}
        spectraPool={spectraPool}
        onAddSpectra={handleAddSpectra}
        onToggleStatus={handleToggleSpectraStatus}
      />
      <DischargeConfirmationDialog
        open={!!patientToDischarge}
        onOpenChange={(isOpen) => !isOpen && setPatientToDischarge(null)}
        patient={patientToDischarge}
        onConfirm={handleConfirmDischarge}
      />
      <ShiftMakerDialog
        open={isShiftMakerOpen}
        onOpenChange={setIsShiftMakerOpen}
        nurses={oncomingNurses}
        patients={patients}
        onPatientDragStart={handlePatientDragStart}
        onDragEnd={handleDragEnd}
        onDropOnNurseSlot={handleOncomingDropOnNurseSlot}
        onClearNurseAssignments={handleOncomingClearNurseAssignments}
        spectraPool={spectraPool}
        techs={techs}
        onAssignSpectra={handleOncomingAssignSpectra}
        onUnassignSpectra={handleOncomingUnassignSpectra}
        onSetSpectraStatus={handleSetSpectraStatus}
        onAddSpectraLog={handleAddSpectraLog}
        onActivateOncomingShift={handleActivateOncomingShift}
        onAddNurseCard={handleOncomingAddNurseCard}
        onRemoveNurseCard={handleOncomingRemoveNurse}
      />
      <footer className="text-center p-4 text-sm text-muted-foreground border-t print-hide">
        UnitView &copy; {currentYear !== null ? currentYear : 'Loading...'}
      </footer>
    </div>
  );
}

    
