import React, { useState, useEffect, useCallback, useRef } from 'react';
// UI Components
import AppHeader from './app-header';
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
import AddRoomDialog from './add-room-dialog';
import CreateUnitDialog from './create-unit-dialog';
import EditRoomDesignationDialog from './edit-room-designation-dialog';
import ChargeNurseCard from './charge-nurse-card';
import UnitClerkCard from './unit-clerk-card';
// Hooks and utils
import { useToast } from "../hooks/use-toast";
import { NUM_ROWS_GRID } from '../lib/grid-utils';
// Types
import type { LayoutName, Patient, StaffRole } from '../types/patient';
import type { Nurse, PatientCareTech, Spectra } from '../types/nurse';
import type { AdmitPatientFormValues } from '../types/forms';
import type { AddStaffMemberFormValues } from '../types/forms';
// Services
import * as layoutService from '../services/layoutService';
import * as patientService from '../services/patientService';
import * as nurseService from '../services/nurseService';
import * as spectraService from '../services/spectraService';
import * as assignmentService from '../services/assignmentService';

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
}

const getFriendlyLayoutName = (layoutName: LayoutName): string => {
    switch (layoutName) {
      case 'North-South View': return 'North/South View';
      default: return layoutName;
    }
  };

export default function UnitViewClientEnhanced({
    initialLayoutName,
    initialAvailableLayouts,
    initialIsLayoutLocked,
    initialPatients,
    initialNurses,
    initialTechs,
    initialSpectraPool
}: UnitViewClientProps) {
  const [isLayoutLocked, setIsLayoutLocked] = useState(initialIsLayoutLocked);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [currentLayoutName, setCurrentLayoutName] = useState<LayoutName>(initialLayoutName);
  const [availableLayouts, setAvailableLayouts] = useState<LayoutName[]>(initialAvailableLayouts);

  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [nurses, setNurses] = useState<Nurse[]>(initialNurses);
  const [techs, setTechs] = useState<PatientCareTech[]>(initialTechs);
  const [spectraPool, setSpectraPool] = useState<Spectra[]>(initialSpectraPool);
  
  const [draggingPatientInfo, setDraggingPatientInfo] = useState<DraggingPatientInfo | null>(null);
  const [draggingNurseInfo, setDraggingNurseInfo] = useState<DraggingNurseInfo | null>(null);
  const [draggingTechInfo, setDraggingTechInfo] = useState<DraggingTechInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();
  
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [admitOrUpdatePatient, setAdmitOrUpdatePatient] = useState<Patient | null>(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isAddStaffMemberDialogOpen, setIsAddStaffMemberDialogOpen] = useState(false);
  const [isAssignStaffDialogOpen, setIsAssignStaffDialogOpen] = useState(false);
  const [staffRoleToAssign, setStaffRoleToAssign] = useState<StaffRole | null>(null);
  const [isManageSpectraDialogOpen, setIsManageSpectraDialogOpen] = useState(false);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [isCreateUnitDialogOpen, setIsCreateUnitDialogOpen] = useState(false);

  // Electron API integration
  useEffect(() => {
    if (window.electronAPI) {
      const handleMenuAction = (action: string, data?: any) => {
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
            handleImportData(data);
            break;
          case 'export-data':
            handleExportData(data);
            break;
          case 'print-report':
            handlePrintReport();
            break;
        }
      };

      window.electronAPI.onMenuAction(handleMenuAction);

      return () => {
        window.electronAPI.removeAllListeners('menu-action');
      };
    }
  }, []);

  // Enhanced data export for Electron
  const handleExportData = useCallback(async (filePath?: string) => {
    if (window.electronAPI) {
      try {
        const exportData = {
          patients,
          nurses,
          techs,
          spectraPool,
          layoutName: currentLayoutName,
          exportedAt: new Date().toISOString(),
          version: '1.0.0'
        };

        const result = await window.electronAPI.exportData(exportData);
        if (result.success) {
          toast({
            title: "Export Successful",
            description: `Data exported to ${result.path}`,
          });
        } else {
          toast({
            title: "Export Failed",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Export Error",
          description: "Failed to export data",
          variant: "destructive",
        });
      }
    }
  }, [patients, nurses, techs, spectraPool, currentLayoutName, toast]);

  // Enhanced data import for Electron
  const handleImportData = useCallback(async (filePath?: string) => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.importData();
        if (result.success) {
          const { patients: importedPatients, nurses: importedNurses, techs: importedTechs, spectraPool: importedSpectra } = result.data;
          
          setPatients(importedPatients || []);
          setNurses(importedNurses || []);
          setTechs(importedTechs || []);
          setSpectraPool(importedSpectra || []);
          
          toast({
            title: "Import Successful",
            description: "Data has been imported successfully",
          });
        } else {
          toast({
            title: "Import Failed",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Failed to import data",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  // Enhanced printing for Electron
  const handlePrintReport = useCallback(async () => {
    if (window.electronAPI) {
      try {
        // Generate the printable HTML
        const reportHtml = `
          <html>
            <head>
              <title>UnitView Report - ${getFriendlyLayoutName(currentLayoutName)}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                .patient { border: 1px solid #ccc; margin: 10px; padding: 10px; }
                .nurse { background: #f0f0f0; margin: 10px; padding: 10px; }
              </style>
            </head>
            <body>
              <h1>UnitView Report - ${getFriendlyLayoutName(currentLayoutName)}</h1>
              <h2>Patients</h2>
              ${patients.map(p => `
                <div class="patient">
                  <strong>${p.roomDesignation}</strong> - ${p.name} (${p.age})
                  <br/>Nurse: ${p.assignedNurse || 'Unassigned'}
                  <br/>${p.chiefComplaint}
                </div>
              `).join('')}
              <h2>Staff</h2>
              ${nurses.map(n => `
                <div class="nurse">
                  <strong>${n.name}</strong> - ${n.role}
                  ${n.spectra ? `<br/>Spectra: ${n.spectra}` : ''}
                </div>
              `).join('')}
            </body>
          </html>
        `;
        
        const result = await window.electronAPI.printToPDF(reportHtml);
        if (result.success) {
          toast({
            title: "Print Successful",
            description: `Report saved to ${result.path}`,
          });
        } else {
          toast({
            title: "Print Failed",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Print Error",
          description: "Failed to generate report",
          variant: "destructive",
        });
      }
    }
  }, [patients, nurses, currentLayoutName, toast]);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await Promise.all([
          patientService.savePatients(currentLayoutName, patients),
          nurseService.saveNurses(currentLayoutName, nurses),
          nurseService.saveTechs(currentLayoutName, techs),
        ]);
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast({
          title: "Auto-save Failed",
          description: "Changes could not be saved automatically",
          variant: "destructive",
        });
      }
    }, 1000);
  }, [currentLayoutName, patients, nurses, techs, toast]);

  // Auto-save when data changes
  useEffect(() => {
    handleAutoSave();
  }, [patients, nurses, techs, handleAutoSave]);

  // Set current year
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        unitName={getFriendlyLayoutName(currentLayoutName)}
        currentYear={currentYear}
        isLayoutLocked={isLayoutLocked}
        setIsLayoutLocked={setIsLayoutLocked}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onPrintReport={handlePrintReport}
      />
      
      <div className="container mx-auto p-4">
        <PatientGrid
          patients={patients}
          nurses={nurses}
          techs={techs}
          spectraPool={spectraPool}
          isLayoutLocked={isLayoutLocked}
          onPatientUpdate={setPatients}
          onNurseUpdate={setNurses}
          onTechUpdate={setTechs}
          onSpectraUpdate={setSpectraPool}
        />
      </div>

      {/* Dialogs would go here - copying from original component */}
      <SaveLayoutDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        currentLayout={currentLayoutName}
        patients={patients}
        nurses={nurses}
        techs={techs}
      />

      <AdmitPatientDialog
        open={!!admitOrUpdatePatient && !isUpdateMode}
        onOpenChange={(open) => !open && setAdmitOrUpdatePatient(null)}
        patient={admitOrUpdatePatient}
        nurses={nurses}
        onAdmitPatient={(updatedPatients) => {
          setPatients(updatedPatients);
          setAdmitOrUpdatePatient(null);
        }}
      />

      <DischargeConfirmationDialog
        open={!!admitOrUpdatePatient && isUpdateMode}
        onOpenChange={(open) => !open && setAdmitOrUpdatePatient(null)}
        patient={admitOrUpdatePatient}
        onDischargePatient={(updatedPatients) => {
          setPatients(updatedPatients);
          setAdmitOrUpdatePatient(null);
        }}
      />

      <AddStaffMemberDialog
        open={isAddStaffMemberDialogOpen}
        onOpenChange={setIsAddStaffMemberDialogOpen}
        patients={patients}
        nurses={nurses}
        techs={techs}
        spectraPool={spectraPool}
        onAddStaffMember={({ newNurses, newTechs }) => {
          if (newNurses) setNurses(newNurses);
          if (newTechs) setTechs(newTechs);
        }}
      />

      <ManageSpectraDialog
        open={isManageSpectraDialogOpen}
        onOpenChange={setIsManageSpectraDialogOpen}
        spectraPool={spectraPool}
        onSpectraUpdate={setSpectraPool}
      />

      <AddRoomDialog
        open={isAddRoomDialogOpen}
        onOpenChange={setIsAddRoomDialogOpen}
        patients={patients}
        nurses={nurses}
        techs={techs}
        onAddRoom={({ newPatients }) => {
          if (newPatients) setPatients(newPatients);
        }}
      />

      <CreateUnitDialog
        open={isCreateUnitDialogOpen}
        onOpenChange={setIsCreateUnitDialogOpen}
        onCreateUnit={(layoutName) => {
          setCurrentLayoutName(layoutName);
          setPatients([]);
          setNurses([]);
          setTechs([]);
        }}
      />
    </div>
  );
}