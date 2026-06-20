
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Patient } from '@/types/patient';
import { getIsolationType } from '@/lib/patient-clinical-helpers';
import type { Nurse, PatientCareTech } from '@/types/nurse';
import {
  AlertTriangle,
  BrainCircuit,
  Wind,
  ShieldAlert,
  Ban,
  HeartHandshake,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import {
  createDefaultAssignmentPrintLayout,
  sortEnabledSections,
  type AssignmentPrintLayoutConfig,
  type AssignmentPrintSectionId,
} from '@/types/assignment-print-layout';
import type { FacilityProfile } from '@/types/facility';
import FacilityPrintHeader from '@/components/facility-print-header';
import { getPrintRootWidth } from '@/lib/print-styles';

interface PrintableAssignmentsProps {
  unitName: string;
  chargeNurseName: string;
  nurses: Nurse[];
  techs: PatientCareTech[];
  patients: Patient[];
  layoutConfig?: AssignmentPrintLayoutConfig;
  facilityProfile?: FacilityProfile;
  /** When true, render on-screen for preview (not off-screen). */
  previewMode?: boolean;
}

const alertIcons: { key: keyof Patient, Icon: LucideIcon, label: string }[] = [
    { key: 'isFallRisk', Icon: AlertTriangle, label: 'Fall Risk' },
    { key: 'isSeizureRisk', Icon: BrainCircuit, label: 'Seizure Risk' },
    { key: 'isAspirationRisk', Icon: Wind, label: 'Aspiration Risk' },
    { key: 'isIsolation', Icon: ShieldAlert, label: 'Isolation' },
    { key: 'isInRestraints', Icon: Ban, label: 'Restraints' },
    { key: 'isComfortCareDNR', Icon: HeartHandshake, label: 'Comfort/DNR' },
];

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getLastName(name: string): string {
  const parts = normalizeName(name).split(' ').filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

const PrintableAssignments: React.FC<PrintableAssignmentsProps> = ({
  unitName,
  chargeNurseName,
  nurses,
  techs,
  patients,
  layoutConfig,
  facilityProfile,
  previewMode = false,
}) => {
  const [shift, setShift] = useState('');
  const [date, setDate] = useState('');
  const config = layoutConfig ?? createDefaultAssignmentPrintLayout();
  const pageWidth = getPrintRootWidth(config.orientation);
  const rootClassName = `uv-print-root uv-print-style-${config.stylePreset}`;

  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 2 && currentHour < 14) {
      setShift('Day Shift');
    } else {
      setShift('Night Shift');
    }
    setDate(new Date().toLocaleDateString('en-US'));
  }, []);

  const patientMap = useMemo(() => new Map(patients.map(p => [p.id, p])), [patients]);
  const staffNurses = useMemo(
    () => nurses.filter(n => n.role === 'Staff Nurse' || n.role === 'Float Pool Nurse'),
    [nurses],
  );
  const sitterNames = useMemo(
    () => nurses.filter(n => n.role === 'Sitter').map(n => n.name).filter(Boolean),
    [nurses],
  );
  const activePatients = useMemo(() => patients.filter(p => p.name !== 'Vacant'), [patients]);
  const dnrRooms = useMemo(
    () => activePatients.filter(p => p.codeStatus !== 'Full Code' || p.isComfortCareDNR),
    [activePatients],
  );
  const isolationRooms = useMemo(
    () => activePatients.filter(p => p.isIsolation),
    [activePatients],
  );
  const restraintRooms = useMemo(
    () => activePatients.filter(p => p.isInRestraints),
    [activePatients],
  );
  const sitterRooms = useMemo(
    () => activePatients.filter(
      p => p.assignedNurse && sitterNames.some(sitter => normalizeName(sitter) === normalizeName(p.assignedNurse || '')),
    ),
    [activePatients, sitterNames],
  );
  const nameSimilarityAlerts = useMemo(() => {
    const matches: string[] = [];
    for (let i = 0; i < activePatients.length; i++) {
      for (let j = i + 1; j < activePatients.length; j++) {
        const a = activePatients[i];
        const b = activePatients[j];
        const aNorm = normalizeName(a.name);
        const bNorm = normalizeName(b.name);
        const sameExact = aNorm === bNorm;
        const sameLast = getLastName(a.name) && getLastName(a.name) === getLastName(b.name);
        if (sameExact || sameLast) {
          matches.push(`${a.roomDesignation} ${a.name} / ${b.roomDesignation} ${b.name}`);
        }
      }
    }
    return matches;
  }, [activePatients]);

  const topRowNurses = staffNurses.slice(0, Math.ceil(staffNurses.length / 2));
  const secondRowNurses = staffNurses.slice(Math.ceil(staffNurses.length / 2));

  const renderPatientRows = (nurse: Nurse) =>
    nurse.assignedPatientIds.map((patientId, idx) => {
      const patient = patientId ? patientMap.get(patientId) : null;
      if (!patient) {
        return <div key={`empty-${nurse.id}-${idx}`} className="uv-print-empty-slot" />;
      }
      const activeAlerts = alertIcons.filter(alert => patient[alert.key]);
      const isolationType = getIsolationType(patient);
      return (
        <div key={`${nurse.id}-${patient.id}`} className="uv-print-patient-row">
          <span className="uv-print-patient-room">{patient.roomDesignation}</span>
          <div className="uv-print-patient-icons">
            {isolationType && (
              <span className="uv-print-isolation-badge">
                <ShieldAlert className="h-2.5 w-2.5" />
                {isolationType}
              </span>
            )}
            {patient.isInRestraints && <Ban className="h-3 w-3" aria-label="Restraints" />}
            {activeAlerts.map(({ Icon, label }) => (
              <Icon key={`${patient.id}-${label}`} className="h-3 w-3" aria-label={label} />
            ))}
          </div>
        </div>
      );
    });

  const renderNurseRow = (rowNurses: Nurse[], keyPrefix: string) => (
    <div
      className="uv-print-nurse-row"
      style={{ gridTemplateColumns: `repeat(${Math.max(1, rowNurses.length)}, minmax(0, 1fr))` }}
    >
      {rowNurses.map(nurse => (
        <div key={`${keyPrefix}-${nurse.id}`} className="uv-print-nurse-card page-break-inside-avoid">
          <h3>{nurse.name}</h3>
          <p className="uv-print-spectra">{nurse.spectra || 'No Spectra'}</p>
          <div>{renderPatientRows(nurse)}</div>
        </div>
      ))}
    </div>
  );

  const sectionRenderers: Record<AssignmentPrintSectionId, () => React.ReactNode> = {
    header: () => (
      <div className="uv-print-header">
        <FacilityPrintHeader
          profile={facilityProfile ?? { name: unitName }}
          subtitle={`${unitName} · ${shift}`}
          className="text-black mb-2"
          logoClassName="h-10"
        />
        <div className="uv-print-header-meta">
          <div>
            <p>{date}</p>
            <p>{shift}</p>
          </div>
          <div className="uv-print-right">
            <p><strong>Charge Nurse:</strong> {chargeNurseName}</p>
            <p><strong>Spectra:</strong> x5501</p>
          </div>
        </div>
      </div>
    ),
    nurseBlocks: () => (
      <>
        {renderNurseRow(topRowNurses, 'top')}
        {secondRowNurses.length > 0 && renderNurseRow(secondRowNurses, 'bottom')}
      </>
    ),
    techBlocks: () => (
      <div className="uv-print-tech-panel page-break-inside-avoid">
        <h3>Patient Care Techs</h3>
        <div className="uv-print-pct-row">
          {techs.map(tech => (
            <div key={tech.id} className="uv-print-pct-card">
              <p className="uv-print-pct-name">{tech.name}</p>
              <p>{tech.spectra || 'No Spectra'}</p>
              <p>{tech.assignmentGroup || 'No Group'}</p>
            </div>
          ))}
        </div>
      </div>
    ),
    unitStats: () => (
      <div className="uv-print-sidebar-panel page-break-inside-avoid">
        <h3>Unit Stats / Alerts</h3>
        <div className="uv-print-stats-block">
          <p><strong>Total Active Patients:</strong> {activePatients.length}</p>
          <p><strong>Sitters:</strong> {sitterNames.length}</p>
          <p><strong>Sitter Rooms:</strong> {sitterRooms.map(p => p.roomDesignation).join(', ') || 'None'}</p>
        </div>
        <div className="uv-print-stats-block">
          <p className="uv-print-stats-title">Name Similarity Alerts</p>
          {nameSimilarityAlerts.length === 0 ? (
            <p>None</p>
          ) : (
            <ul className="uv-print-stats-list">
              {nameSimilarityAlerts.map((alert, idx) => (
                <li key={`name-alert-${idx}`}>{alert}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="uv-print-stats-block">
          <p className="uv-print-stats-title">DNR/DNI Rooms</p>
          <p>{dnrRooms.map(p => p.roomDesignation).join(', ') || 'None'}</p>
        </div>
        <div className="uv-print-stats-block">
          <p className="uv-print-stats-title">Isolation Rooms</p>
          <ul className="uv-print-stats-list">
            {isolationRooms.length === 0 ? (
              <li>None</li>
            ) : (
              isolationRooms.map(p => (
                <li key={`iso-${p.id}`}>
                  {p.roomDesignation} ({getIsolationType(p)})
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="uv-print-stats-block">
          <p className="uv-print-stats-title">Restraint Rooms</p>
          <ul className="uv-print-stats-list">
            {restraintRooms.length === 0 ? (
              <li>None</li>
            ) : (
              restraintRooms.map(p => (
                <li key={`rst-${p.id}`}>{p.roomDesignation}</li>
              ))
            )}
          </ul>
        </div>
      </div>
    ),
    legend: () => (
      <div className="uv-print-legend page-break-inside-avoid">
        <p className="uv-print-stats-title">Legend</p>
        <div className="uv-print-legend-items">
          <span className="uv-print-legend-item"><ShieldAlert className="h-3 w-3" /> Isolation</span>
          <span className="uv-print-legend-item"><Ban className="h-3 w-3" /> Restraints</span>
          <span className="uv-print-legend-item"><HeartHandshake className="h-3 w-3" /> DNR/Comfort</span>
          <span className="uv-print-legend-item"><UserRound className="h-3 w-3" /> Sitter-related</span>
        </div>
      </div>
    ),
  };

  const enabledSections = sortEnabledSections(config);
  const fullSections = enabledSections.filter(s => s.region === 'full');
  const mainSections = enabledSections.filter(s => s.region === 'main');
  const sidebarSections = enabledSections.filter(s => s.region === 'sidebar');

  const renderSection = (id: AssignmentPrintSectionId) => (
    <div key={id} data-print-section={id}>
      {sectionRenderers[id]()}
    </div>
  );

  const body = config.columnMode === 'single-column' ? (
    <div className="uv-print-layout-single">
      {enabledSections.map(s => renderSection(s.id))}
    </div>
  ) : (
    <>
      {fullSections.map(s => renderSection(s.id))}
      {(mainSections.length > 0 || sidebarSections.length > 0) && (
        <div className="uv-print-layout-two uv-print-assignments-layout">
          <div className="uv-print-main">
            {mainSections.map(s => renderSection(s.id))}
          </div>
          {sidebarSections.length > 0 && (
            <div className="uv-print-sidebar">
              {sidebarSections.map(s => renderSection(s.id))}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div
      id={previewMode ? undefined : 'printable-assignments-report'}
      className={rootClassName}
      data-print-orientation={config.orientation}
      data-print-style={config.stylePreset}
      aria-hidden={previewMode ? undefined : 'true'}
      style={
        previewMode
          ? { width: '100%', maxWidth: pageWidth, margin: '0 auto', background: '#fff', color: '#000' }
          : {
              position: 'absolute',
              left: '-9999px',
              top: 0,
              width: pageWidth,
              maxWidth: '100vw',
            }
      }
    >
      {body}
    </div>
  );
};

export default PrintableAssignments;
