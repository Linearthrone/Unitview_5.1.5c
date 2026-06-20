import type { LayoutName } from './patient';

export type PrintOrientation = 'portrait' | 'landscape';

export type PrintStylePreset =
  | 'classic'
  | 'modern'
  | 'compact'
  | 'roster'
  | 'high-contrast';

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

export type ChargePrintColumnCount = 2 | 3 | 4;

export interface ChargePrintLayoutConfig {
  columns: ChargePrintColumnCount;
  showNotes: boolean;
  showAlerts: boolean;
  showLdas: boolean;
  showMobilityIcons: boolean;
}

export interface AssignmentPrintLayoutConfig {
  version: 2;
  /** Page orientation for both assignment and charge prints. */
  orientation: PrintOrientation;
  /** Visual theme applied to print output. */
  stylePreset: PrintStylePreset;
  columnMode: AssignmentPrintColumnMode;
  sections: AssignmentPrintSectionConfig[];
  charge: ChargePrintLayoutConfig;
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

export function createDefaultChargePrintLayout(): ChargePrintLayoutConfig {
  return {
    columns: 2,
    showNotes: true,
    showAlerts: true,
    showLdas: true,
    showMobilityIcons: true,
  };
}

export function createDefaultAssignmentPrintLayout(): AssignmentPrintLayoutConfig {
  return {
    version: 2,
    orientation: 'portrait',
    stylePreset: 'classic',
    columnMode: 'two-column',
    sections: [
      { id: 'header', label: ASSIGNMENT_PRINT_SECTION_LABELS.header, enabled: true, order: 0, region: 'full' },
      { id: 'nurseBlocks', label: ASSIGNMENT_PRINT_SECTION_LABELS.nurseBlocks, enabled: true, order: 1, region: 'main' },
      { id: 'techBlocks', label: ASSIGNMENT_PRINT_SECTION_LABELS.techBlocks, enabled: true, order: 2, region: 'main' },
      { id: 'unitStats', label: ASSIGNMENT_PRINT_SECTION_LABELS.unitStats, enabled: true, order: 3, region: 'sidebar' },
      { id: 'legend', label: ASSIGNMENT_PRINT_SECTION_LABELS.legend, enabled: true, order: 4, region: 'sidebar' },
    ],
    charge: createDefaultChargePrintLayout(),
  };
}

/** Curated starting points — user can mix orientation, style, and section layout. */
export function createAssignmentPrintLayoutFromPreset(
  preset: PrintStylePreset,
): AssignmentPrintLayoutConfig {
  const base = createDefaultAssignmentPrintLayout();
  switch (preset) {
    case 'modern':
      return {
        ...base,
        stylePreset: 'modern',
        orientation: 'portrait',
        columnMode: 'two-column',
        charge: { ...base.charge, columns: 2 },
      };
    case 'compact':
      return {
        ...base,
        stylePreset: 'compact',
        orientation: 'landscape',
        columnMode: 'single-column',
        sections: base.sections.map((s) =>
          s.id === 'unitStats' || s.id === 'legend'
            ? { ...s, region: 'full' as AssignmentPrintRegion }
            : s,
        ),
        charge: { ...base.charge, columns: 4, showNotes: false },
      };
    case 'roster':
      return {
        ...base,
        stylePreset: 'roster',
        orientation: 'landscape',
        columnMode: 'single-column',
        sections: base.sections.map((s) =>
          s.id === 'legend' ? { ...s, enabled: false } : s,
        ),
        charge: { ...base.charge, columns: 3, showMobilityIcons: false },
      };
    case 'high-contrast':
      return {
        ...base,
        stylePreset: 'high-contrast',
        orientation: 'portrait',
        columnMode: 'two-column',
        charge: { ...base.charge, columns: 2 },
      };
    case 'classic':
    default:
      return base;
  }
}

function sanitizeChargeLayout(input: Partial<ChargePrintLayoutConfig> | undefined): ChargePrintLayoutConfig {
  const defaults = createDefaultChargePrintLayout();
  if (!input) return defaults;
  const columns: ChargePrintColumnCount =
    input.columns === 3 || input.columns === 4 ? input.columns : 2;
  return {
    columns,
    showNotes: input.showNotes !== false,
    showAlerts: input.showAlerts !== false,
    showLdas: input.showLdas !== false,
    showMobilityIcons: input.showMobilityIcons !== false,
  };
}

export function sanitizeAssignmentPrintLayout(
  input: Partial<AssignmentPrintLayoutConfig> & { version?: number } | undefined,
): AssignmentPrintLayoutConfig {
  const defaults = createDefaultAssignmentPrintLayout();
  if (!input) return defaults;

  // Migrate v1 configs (no orientation/style/charge)
  const isLegacy = input.version !== 2;

  const orientation: PrintOrientation =
    !isLegacy && input.orientation === 'landscape' ? 'landscape' : defaults.orientation;
  const stylePreset: PrintStylePreset =
    !isLegacy &&
    input.stylePreset &&
    ['classic', 'modern', 'compact', 'roster', 'high-contrast'].includes(input.stylePreset)
      ? input.stylePreset
      : defaults.stylePreset;

  const columnMode: AssignmentPrintColumnMode =
    input.columnMode === 'single-column' ? 'single-column' : 'two-column';

  const byId = new Map<AssignmentPrintSectionId, AssignmentPrintSectionConfig>();
  const sectionsInput = Array.isArray(input.sections) ? input.sections : defaults.sections;
  for (const section of sectionsInput) {
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

  const charge = sanitizeChargeLayout(isLegacy ? undefined : input.charge);

  return {
    version: 2,
    orientation,
    stylePreset,
    columnMode,
    sections,
    charge,
  };
}

export function sortEnabledSections(config: AssignmentPrintLayoutConfig): AssignmentPrintSectionConfig[] {
  return config.sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
}

export interface AssignmentPrintLayoutContext {
  layoutName: LayoutName;
  config: AssignmentPrintLayoutConfig;
}
