
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Patient, MobilityStatus } from '@/types/patient';
import {
  AlertTriangle,
  ShieldAlert,
  Ban,
  BrainCircuit,
  Wind,
  HeartHandshake,
} from 'lucide-react';
import type { FacilityProfile } from '@/types/facility';
import FacilityPrintHeader from '@/components/facility-print-header';
import {
  createDefaultAssignmentPrintLayout,
  type AssignmentPrintLayoutConfig,
} from '@/types/assignment-print-layout';
import { getPrintRootWidth } from '@/lib/print-styles';

interface PrintableReportProps {
  patients: Patient[];
  facilityProfile?: FacilityProfile;
  layoutConfig?: AssignmentPrintLayoutConfig;
  previewMode?: boolean;
}

const formatDate = (date: Date): string => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  } catch {
    return 'N/A';
  }
};

const PrintableReport: React.FC<PrintableReportProps> = ({
  patients,
  facilityProfile,
  layoutConfig,
  previewMode = false,
}) => {
  const [generatedDate, setGeneratedDate] = useState('');
  const config = layoutConfig ?? createDefaultAssignmentPrintLayout();
  const charge = config.charge;
  const pageWidth = getPrintRootWidth(config.orientation);
  const rootClassName = `uv-print-root uv-print-style-${config.stylePreset}`;

  useEffect(() => {
    setGeneratedDate(new Date().toLocaleString());
  }, []);

  const activePatients = useMemo(
    () => patients.filter((p) => p.gridRow > 0 && p.gridColumn > 0 && p.name !== 'Vacant'),
    [patients],
  );
  const sortedPatients = useMemo(
    () => [...activePatients].sort((a, b) => a.bedNumber - b.bedNumber),
    [activePatients],
  );

  const genderClass = (patient: Patient) => {
    if (patient.isComfortCareDNR) return 'uv-print-dnr';
    if (patient.gender === 'Male') return 'uv-print-gender-male';
    if (patient.gender === 'Female') return 'uv-print-gender-female';
    return 'uv-print-gender-neutral';
  };

  return (
    <div
      id={previewMode ? undefined : 'printable-charge-report'}
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
      <FacilityPrintHeader
        profile={facilityProfile ?? { name: 'Your Facility Name' }}
        subtitle="Unit Charge Report"
        className="text-black"
      />
      <p className="uv-print-generated">
        {generatedDate ? `Generated on: ${generatedDate}` : 'Generating...'}
      </p>

      <div
        className="uv-print-charge-grid"
        style={{ gridTemplateColumns: `repeat(${charge.columns}, minmax(0, 1fr))` }}
      >
        {sortedPatients.map((patient) => {
          const alerts: { label: string }[] = [];
          if (patient.isFallRisk) alerts.push({ label: 'Fall Risk' });
          if (patient.isSeizureRisk) alerts.push({ label: 'Seizure' });
          if (patient.isAspirationRisk) alerts.push({ label: 'Aspiration' });
          if (patient.isIsolation) alerts.push({ label: 'Isolation' });
          if (patient.isInRestraints) alerts.push({ label: 'Restraints' });
          if (patient.isComfortCareDNR) alerts.push({ label: 'DNR/Comfort' });

          return (
            <div
              key={patient.id}
              className={`uv-print-charge-card page-break-inside-avoid ${genderClass(patient)}`}
            >
              <div className="uv-print-charge-header">
                <div className="uv-print-charge-title">
                  {patient.roomDesignation} — {patient.name}
                </div>
                <div>
                  {patient.age} {patient.gender?.[0] ?? ''}
                </div>
              </div>

              <p className="uv-print-charge-meta">
                <strong>Admit:</strong> {formatDate(patient.admitDate)} /{' '}
                <strong>EDD:</strong> {formatDate(patient.dischargeDate)}
              </p>
              <p className="uv-print-charge-complaint">
                <strong>Complaint:</strong> {patient.chiefComplaint}
              </p>

              <div className="uv-print-charge-details">
                <div><strong>Diet:</strong> {patient.diet}</div>
                <div>
                  <strong>Mobility:</strong>{' '}
                  {charge.showMobilityIcons ? `${patient.mobility}` : patient.mobility}
                </div>
                <div><strong>Code:</strong> {patient.codeStatus}</div>
                <div><strong>A&O:</strong> {patient.orientationStatus.toUpperCase()}</div>
                <div><strong>Nurse:</strong> {patient.assignedNurse || 'N/A'}</div>
                {charge.showLdas && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>LDAs:</strong>{' '}
                    {(Array.isArray(patient.ldas) ? patient.ldas.join(', ') : '') || 'None'}
                  </div>
                )}
              </div>

              {charge.showNotes && patient.notes && (
                <div className="uv-print-charge-notes">
                  <strong>Notes:</strong> {patient.notes}
                </div>
              )}

              {charge.showAlerts && alerts.length > 0 && (
                <div className="uv-print-charge-alerts">
                  <strong>Alerts:</strong>
                  {alerts.map((a) => (
                    <span key={a.label} className="uv-print-charge-alert-tag">
                      {a.label === 'Fall Risk' && <AlertTriangle className="h-3 w-3" />}
                      {a.label === 'Seizure' && <BrainCircuit className="h-3 w-3" />}
                      {a.label === 'Aspiration' && <Wind className="h-3 w-3" />}
                      {a.label === 'Isolation' && <ShieldAlert className="h-3 w-3" />}
                      {a.label === 'Restraints' && <Ban className="h-3 w-3" />}
                      {a.label === 'DNR/Comfort' && <HeartHandshake className="h-3 w-3" />}
                      {a.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrintableReport;
