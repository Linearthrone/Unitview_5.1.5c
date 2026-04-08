
'use client';

import { useState, useEffect } from 'react';
import type { Patient } from '@/types/patient';
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
import { cn } from '@/lib/utils';

interface PrintableAssignmentsProps {
  unitName: string;
  chargeNurseName: string;
  nurses: Nurse[];
  techs: PatientCareTech[];
  patients: Patient[];
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

function getIsolationType(patient: Patient): string | null {
  if (!patient.isIsolation) return null;
  const haystack = `${patient.notes || ''} ${patient.chiefComplaint || ''} ${(patient.ldas || []).join(' ')}`.toLowerCase();
  if (haystack.includes('airborne')) return 'Airborne';
  if (haystack.includes('droplet')) return 'Droplet';
  if (haystack.includes('contact')) return 'Contact';
  return 'Isolation';
}

const PrintableAssignments: React.FC<PrintableAssignmentsProps> = ({
  unitName,
  chargeNurseName,
  nurses,
  techs,
  patients,
}) => {
  const [shift, setShift] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    // This logic is now in useEffect to ensure it only runs on the client,
    // preventing a hydration mismatch.
    const currentHour = new Date().getHours();
    // Day shift from 2 AM (2) to 1:59 PM (13)
    // Night shift from 2 PM (14) to 1:59 AM (1)
    if (currentHour >= 2 && currentHour < 14) {
      setShift('Day Shift');
    } else {
      setShift('Night Shift');
    }
    setDate(new Date().toLocaleDateString('en-US'));
  }, []);
  
  const patientMap = new Map(patients.map(p => [p.id, p]));
  const staffNurses = nurses.filter(n => n.role === 'Staff Nurse' || n.role === 'Float Pool Nurse');
  const sitterNames = nurses.filter(n => n.role === 'Sitter').map(n => n.name).filter(Boolean);
  const activePatients = patients.filter(p => p.name !== 'Vacant');
  const dnrRooms = activePatients.filter(p => p.codeStatus !== 'Full Code' || p.isComfortCareDNR);
  const isolationRooms = activePatients.filter(p => p.isIsolation);
  const restraintRooms = activePatients.filter(p => p.isInRestraints);
  const sitterRooms = activePatients.filter(
    p => p.assignedNurse && sitterNames.some(sitter => normalizeName(sitter) === normalizeName(p.assignedNurse || ''))
  );
  const nameSimilarityAlerts = (() => {
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
  })();
  const topRowNurses = staffNurses.slice(0, Math.ceil(staffNurses.length / 2));
  const secondRowNurses = staffNurses.slice(Math.ceil(staffNurses.length / 2));

  /* Off-screen (not display:none) so cloned print HTML is visible in the print window before Tailwind CDN runs */
  return (
    <div
      id="printable-assignments-report"
      className="text-black font-sans p-4 text-[11px]"
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: '8.5in',
        maxWidth: '100vw',
      }}
    >
      <div className="report-header relative mb-4">
        <div className="unit-name">{unitName}</div>
        <div className="flex justify-between w-full">
            <div>
              <p>{date}</p>
              <p>{shift}</p>
            </div>
            <div>
              <p className="text-right"><strong>Charge Nurse:</strong> {chargeNurseName}</p>
              <p className="text-right"><strong>Spectra:</strong> x5501</p>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-[1fr_18rem] gap-3 uv-print-assignments-layout">
        <div className="space-y-3">
          <div className="grid gap-2 uv-print-nurse-row" style={{ gridTemplateColumns: `repeat(${Math.max(1, topRowNurses.length)}, minmax(0, 1fr))` }}>
            {topRowNurses.map(nurse => (
              <div key={nurse.id} className="border border-black p-2 flex flex-col">
                <h3 className="font-bold text-center border-b border-black pb-1 mb-1">{nurse.name}</h3>
                <p className="text-center text-[10px] mb-2">{nurse.spectra || 'No Spectra'}</p>
                <div className="space-y-1">
                  {nurse.assignedPatientIds.map((patientId, idx) => {
                    const patient = patientId ? patientMap.get(patientId) : null;
                    if (!patient) return <div key={`empty-top-${nurse.id}-${idx}`} className="h-5 border-b border-dotted border-black/20" />;
                    const activeAlerts = alertIcons.filter(alert => patient[alert.key]);
                    const isolationType = getIsolationType(patient);
                    return (
                      <div key={`${nurse.id}-${patient.id}`} className="flex justify-between items-center">
                        <span className="font-semibold">{patient.roomDesignation}</span>
                        <div className="flex items-center gap-1">
                          {isolationType && (
                            <span className="inline-flex items-center gap-0.5 border border-black rounded px-1 text-[9px]">
                              <ShieldAlert className="h-2.5 w-2.5" />
                              {isolationType}
                            </span>
                          )}
                          {patient.isInRestraints && <Ban className="h-3 w-3" aria-label="Restraints" />}
                          {activeAlerts.map(({ Icon, label }) => <Icon key={`${patient.id}-${label}`} className="h-3 w-3" aria-label={label} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-2 uv-print-nurse-row" style={{ gridTemplateColumns: `repeat(${Math.max(1, secondRowNurses.length)}, minmax(0, 1fr))` }}>
            {secondRowNurses.map(nurse => (
              <div key={nurse.id} className="border border-black p-2 flex flex-col">
                <h3 className="font-bold text-center border-b border-black pb-1 mb-1">{nurse.name}</h3>
                <p className="text-center text-[10px] mb-2">{nurse.spectra || 'No Spectra'}</p>
                <div className="space-y-1">
                  {nurse.assignedPatientIds.map((patientId, idx) => {
                    const patient = patientId ? patientMap.get(patientId) : null;
                    if (!patient) return <div key={`empty-bottom-${nurse.id}-${idx}`} className="h-5 border-b border-dotted border-black/20" />;
                    const activeAlerts = alertIcons.filter(alert => patient[alert.key]);
                    const isolationType = getIsolationType(patient);
                    return (
                      <div key={`${nurse.id}-${patient.id}`} className="flex justify-between items-center">
                        <span className="font-semibold">{patient.roomDesignation}</span>
                        <div className="flex items-center gap-1">
                          {isolationType && (
                            <span className="inline-flex items-center gap-0.5 border border-black rounded px-1 text-[9px]">
                              <ShieldAlert className="h-2.5 w-2.5" />
                              {isolationType}
                            </span>
                          )}
                          {patient.isInRestraints && <Ban className="h-3 w-3" aria-label="Restraints" />}
                          {activeAlerts.map(({ Icon, label }) => <Icon key={`${patient.id}-${label}`} className="h-3 w-3" aria-label={label} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="border border-black p-2">
            <h3 className="font-bold text-center border-b border-black pb-1 mb-2">Patient Care Techs</h3>
            <div className="grid grid-cols-3 gap-2 uv-print-pct-row">
              {techs.map(tech => (
                <div key={tech.id} className="text-sm border border-black/30 rounded p-1">
                  <p className="font-bold">{tech.name}</p>
                  <p className="text-[10px]">{tech.spectra || 'No Spectra'}</p>
                  <p className="text-[10px]">{tech.assignmentGroup || 'No Group'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-black p-2 space-y-3">
          <h3 className="font-bold text-center border-b border-black pb-1">Unit Stats / Alerts</h3>
          <div>
            <p><strong>Total Active Patients:</strong> {activePatients.length}</p>
            <p><strong>Sitters:</strong> {sitterNames.length}</p>
            <p><strong>Sitter Rooms:</strong> {sitterRooms.map(p => p.roomDesignation).join(', ') || 'None'}</p>
          </div>

          <div>
            <p className="font-semibold">Name Similarity Alerts</p>
            {nameSimilarityAlerts.length === 0 ? (
              <p>None</p>
            ) : (
              <ul className="list-disc pl-4">
                {nameSimilarityAlerts.map((alert, idx) => (
                  <li key={`name-alert-${idx}`}>{alert}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="font-semibold">DNR/DNI Rooms</p>
            <p>{dnrRooms.map(p => p.roomDesignation).join(', ') || 'None'}</p>
          </div>

          <div>
            <p className="font-semibold">Isolation Rooms</p>
            <ul className="list-disc pl-4">
              {isolationRooms.length === 0 ? (
                <li>None</li>
              ) : (
                isolationRooms.map(p => (
                  <li key={`iso-${p.id}`} className="flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    <span>{p.roomDesignation} ({getIsolationType(p)})</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <p className="font-semibold">Restraint Rooms</p>
            <ul className="list-disc pl-4">
              {restraintRooms.length === 0 ? (
                <li>None</li>
              ) : (
                restraintRooms.map(p => (
                  <li key={`rst-${p.id}`} className="flex items-center gap-1">
                    <Ban className="h-3 w-3" />
                    <span>{p.roomDesignation}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="border-t border-black pt-2 text-[10px]">
            <p className="font-semibold mb-1">Legend</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Isolation</span>
              <span className="inline-flex items-center gap-1"><Ban className="h-3 w-3" /> Restraints</span>
              <span className="inline-flex items-center gap-1"><HeartHandshake className="h-3 w-3" /> DNR/Comfort</span>
              <span className="inline-flex items-center gap-1"><UserRound className="h-3 w-3" /> Sitter-related</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableAssignments;
