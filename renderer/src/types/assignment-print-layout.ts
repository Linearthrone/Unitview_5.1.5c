import type { LayoutName } from './patient';

export type AssignmentPrintSectionId =
  | 'header'
  | 'nurseBlocks'
  | 'techBlocks'
  | 'unitStats'
  | 'legend';

export type AssignmentPrintRegion = 'full' | 'main' | 'sidebar';

export interface AssignmentPrintSectionConfig {
  id: AssignmentPrintSectionId;
  label: string;
  enabled: boolean;
  order: number;
  region: AssignmentPrintRegion;
}

export type AssignmentPrintColumnMode = 'two-column' | 'single-column';

export interface AssignmentPrintLayoutConfig {
  version: 1;
  columnMode: AssignmentPrintColumnMode;
  sections: AssignmentPrintSectionConfig[];
}

export const ASSIGNMENT_PRINT_SECTION_LABELS: Record<AssignmentPrintSectionId, string> = {
  header: 'Header / meta (date, shift, unit, charge)',
  nurseBlocks: 'Nurse assignment blocks',
  techBlocks: 'Patient care tech blocks',
  unitStats: 'Unit stats / alerts',
  legend: 'Icon legend',
};

const SECTION_IDS: AssignmentPrintSectionId[] = [
  'header',
  'nurseBlocks',
  'techBlocks',
  'unitStats',
  'legend',
];

export function createDefaultAssignmentPrintLayout(): AssignmentPrintLayoutConfig {
  return {
    version: 1,
    columnMode: 'two-column',
    sections: [
      { id: 'header', label: ASSIGNMENT_PRINT_SECTION_LABELS.header, enabled: true, order: 0, region: 'full' },
      { id: 'nurseBlocks', label: ASSIGNMENT_PRINT_SECTION_LABELS.nurseBlocks, enabled: true, order: 1, region: 'main' },
      { id: 'techBlocks', label: ASSIGNMENT_PRINT_SECTION_LABELS.techBlocks, enabled: true, order: 2, region: 'main' },
      { id: 'unitStats', label: ASSIGNMENT_PRINT_SECTION_LABELS.unitStats, enabled: true, order: 3, region: 'sidebar' },
      { id: 'legend', label: ASSIGNMENT_PRINT_SECTION_LABELS.legend, enabled: true, order: 4, region: 'sidebar' },
    ],
  };
}

export function sanitizeAssignmentPrintLayout(
  input: Partial<AssignmentPrintLayoutConfig> | undefined,
): AssignmentPrintLayoutConfig {
  const defaults = createDefaultAssignmentPrintLayout();
  if (!input || input.version !== 1 || !Array.isArray(input.sections)) {
    return defaults;
  }

  const columnMode: AssignmentPrintColumnMode =
    input.columnMode === 'single-column' ? 'single-column' : 'two-column';

  const byId = new Map<AssignmentPrintSectionId, AssignmentPrintSectionConfig>();
  for (const section of input.sections) {
    if (!SECTION_IDS.includes(section.id)) continue;
    const region: AssignmentPrintRegion =
      section.region === 'full' || section.region === 'main' || section.region === 'sidebar'
        ? section.region
        : defaults.sections.find((s) => s.id === section.id)?.region ?? 'main';
    byId.set(section.id, {
      id: section.id,
      label: ASSIGNMENT_PRINT_SECTION_LABELS[section.id],
      enabled: section.enabled !== false,
      order: Number.isFinite(section.order) ? section.order : 0,
      region,
    });
  }

  const sections = SECTION_IDS.map((id, index) => {
    const existing = byId.get(id);
    if (existing) return existing;
    const fallback = defaults.sections.find((s) => s.id === id)!;
    return { ...fallback, order: index };
  });

  return { version: 1, columnMode, sections };
}

export function sortEnabledSections(config: AssignmentPrintLayoutConfig): AssignmentPrintSectionConfig[] {
  return config.sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
}

export interface AssignmentPrintLayoutContext {
  layoutName: LayoutName;
  config: AssignmentPrintLayoutConfig;
}
