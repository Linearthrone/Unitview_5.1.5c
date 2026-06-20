'use client';



import React, { useCallback, useEffect, useState } from 'react';

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogFooter,

  DialogHeader,

  DialogTitle,

} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';

import { Checkbox } from '@/components/ui/checkbox';

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from '@/components/ui/select';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ArrowDown, ArrowUp, Printer, RotateCcw } from 'lucide-react';

import PrintableAssignments from './printable-assignments';

import PrintableReport from './printable-report';

import { PRINT_REPORT_CSS } from '@/lib/print-utils';

import { buildPrintStylesheet, PRINT_STYLE_PRESET_CATALOG } from '@/lib/print-styles';

import type { LayoutName, Patient } from '@/types/patient';

import type { Nurse, PatientCareTech } from '@/types/nurse';

import {

  ASSIGNMENT_PRINT_SECTION_LABELS,

  createAssignmentPrintLayoutFromPreset,

  createDefaultAssignmentPrintLayout,

  sanitizeAssignmentPrintLayout,

  type AssignmentPrintLayoutConfig,

  type AssignmentPrintRegion,

  type AssignmentPrintSectionConfig,

  type PrintStylePreset,

} from '@/types/assignment-print-layout';

import type { FacilityProfile } from '@/types/facility';

import { cn } from '@/lib/utils';



interface AssignmentPrintLayoutDialogProps {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  layoutName: LayoutName;

  unitDisplayName: string;

  chargeNurseName: string;

  nurses: Nurse[];

  techs: PatientCareTech[];

  patients: Patient[];

  initialConfig: AssignmentPrintLayoutConfig;

  facilityProfile?: FacilityProfile;

  onSave: (config: AssignmentPrintLayoutConfig) => Promise<void>;

  onPrint: (config: AssignmentPrintLayoutConfig, reportType: 'assignments' | 'charge') => void;

}



const REGION_OPTIONS: { value: AssignmentPrintRegion; label: string }[] = [

  { value: 'full', label: 'Full width' },

  { value: 'main', label: 'Main column' },

  { value: 'sidebar', label: 'Sidebar' },

];



export default function AssignmentPrintLayoutDialog({

  open,

  onOpenChange,

  layoutName,

  unitDisplayName,

  chargeNurseName,

  nurses,

  techs,

  patients,

  initialConfig,

  facilityProfile,

  onSave,

  onPrint,

}: AssignmentPrintLayoutDialogProps) {

  const [draft, setDraft] = useState<AssignmentPrintLayoutConfig>(initialConfig);

  const [isSaving, setIsSaving] = useState(false);

  const [previewTab, setPreviewTab] = useState<'assignments' | 'charge'>('assignments');



  useEffect(() => {

    if (open) {

      setDraft(sanitizeAssignmentPrintLayout(initialConfig));

    }

  }, [open, initialConfig]);



  const updateSection = useCallback(

    (id: AssignmentPrintSectionConfig['id'], patch: Partial<AssignmentPrintSectionConfig>) => {

      setDraft((prev) =>

        sanitizeAssignmentPrintLayout({

          ...prev,

          sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),

        }),

      );

    },

    [],

  );



  const moveSection = useCallback((id: AssignmentPrintSectionConfig['id'], direction: -1 | 1) => {

    setDraft((prev) => {

      const sorted = [...prev.sections].sort((a, b) => a.order - b.order);

      const index = sorted.findIndex((s) => s.id === id);

      if (index < 0) return prev;

      const swapIndex = index + direction;

      if (swapIndex < 0 || swapIndex >= sorted.length) return prev;

      const next = [...sorted];

      const tmpOrder = next[index].order;

      next[index] = { ...next[index], order: next[swapIndex].order };

      next[swapIndex] = { ...next[swapIndex], order: tmpOrder };

      return sanitizeAssignmentPrintLayout({ ...prev, sections: next });

    });

  }, []);



  const applyStylePreset = (preset: PrintStylePreset) => {

    setDraft(createAssignmentPrintLayoutFromPreset(preset));

  };



  const handleReset = () => setDraft(createDefaultAssignmentPrintLayout());



  const handleSave = async () => {

    setIsSaving(true);

    try {

      await onSave(draft);

      onOpenChange(false);

    } finally {

      setIsSaving(false);

    }

  };



  const sortedSections = [...draft.sections].sort((a, b) => a.order - b.order);

  const previewCss = buildPrintStylesheet(draft.orientation, draft.stylePreset, PRINT_REPORT_CSS);



  return (

    <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent className="max-w-7xl max-h-[92vh] overflow-hidden flex flex-col">

        <DialogHeader>

          <DialogTitle>Print layout designer</DialogTitle>

          <DialogDescription>

            Choose orientation and style, then tune assignment sections and charge report columns for{' '}

            <strong>{layoutName}</strong>. Mix presets with custom section order.

          </DialogDescription>

        </DialogHeader>



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">

          <div className="space-y-4 overflow-y-auto pr-1">

            <div className="grid grid-cols-2 gap-3">

              <div className="space-y-2">

                <Label htmlFor="print-orientation">Page orientation</Label>

                <Select

                  value={draft.orientation}

                  onValueChange={(value) =>

                    setDraft((prev) =>

                      sanitizeAssignmentPrintLayout({

                        ...prev,

                        orientation: value === 'landscape' ? 'landscape' : 'portrait',

                      }),

                    )

                  }

                >

                  <SelectTrigger id="print-orientation">

                    <SelectValue />

                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="portrait">Portrait (8.5 × 11)</SelectItem>

                    <SelectItem value="landscape">Landscape (11 × 8.5)</SelectItem>

                  </SelectContent>

                </Select>

              </div>

              <div className="space-y-2">

                <Label htmlFor="assignment-column-mode">Assignment columns</Label>

                <Select

                  value={draft.columnMode}

                  onValueChange={(value) =>

                    setDraft((prev) =>

                      sanitizeAssignmentPrintLayout({

                        ...prev,

                        columnMode: value === 'single-column' ? 'single-column' : 'two-column',

                      }),

                    )

                  }

                >

                  <SelectTrigger id="assignment-column-mode">

                    <SelectValue />

                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="two-column">Two columns (main + sidebar)</SelectItem>

                    <SelectItem value="single-column">Single column (stacked)</SelectItem>

                  </SelectContent>

                </Select>

              </div>

            </div>



            <div className="space-y-2">

              <Label>Style presets</Label>

              <p className="text-xs text-muted-foreground">

                Pick a starting look — you can still change orientation and sections afterward.

              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                {PRINT_STYLE_PRESET_CATALOG.map((preset) => (

                  <button

                    key={preset.id}

                    type="button"

                    onClick={() => applyStylePreset(preset.id)}

                    className={cn(

                      'rounded-md border p-3 text-left transition hover:border-primary/60 hover:bg-muted/40',

                      draft.stylePreset === preset.id && 'border-primary ring-2 ring-primary/30 bg-primary/5',

                    )}

                  >

                    <div className="text-sm font-semibold">{preset.label}</div>

                    <div className="text-xs text-muted-foreground mt-1">{preset.description}</div>

                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-2">

                      Best for: {preset.bestFor}

                    </div>

                  </button>

                ))}

              </div>

            </div>



            <div className="space-y-2 rounded-md border p-3 bg-card">

              <Label>Charge report options</Label>

              <div className="grid grid-cols-2 gap-3">

                <div className="space-y-2">

                  <Label htmlFor="charge-columns" className="text-xs">

                    Patient columns

                  </Label>

                  <Select

                    value={String(draft.charge.columns)}

                    onValueChange={(value) =>

                      setDraft((prev) =>

                        sanitizeAssignmentPrintLayout({

                          ...prev,

                          charge: {

                            ...prev.charge,

                            columns: value === '4' ? 4 : value === '3' ? 3 : 2,

                          },

                        }),

                      )

                    }

                  >

                    <SelectTrigger id="charge-columns" className="h-8">

                      <SelectValue />

                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="2">2 columns</SelectItem>

                      <SelectItem value="3">3 columns</SelectItem>

                      <SelectItem value="4">4 columns (dense)</SelectItem>

                    </SelectContent>

                  </Select>

                </div>

              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">

                {[

                  { key: 'showNotes' as const, label: 'Patient notes' },

                  { key: 'showAlerts' as const, label: 'Alert badges' },

                  { key: 'showLdas' as const, label: 'LDAs line' },

                  { key: 'showMobilityIcons' as const, label: 'Mobility detail' },

                ].map(({ key, label }) => (

                  <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">

                    <Checkbox

                      checked={draft.charge[key]}

                      onCheckedChange={(checked) =>

                        setDraft((prev) =>

                          sanitizeAssignmentPrintLayout({

                            ...prev,

                            charge: { ...prev.charge, [key]: checked === true },

                          }),

                        )

                      }

                    />

                    {label}

                  </label>

                ))}

              </div>

            </div>



            <div className="space-y-2">

              <Label>Assignment sections</Label>

              <ul className="space-y-2">

                {sortedSections.map((section, index) => (

                  <li

                    key={section.id}

                    className="rounded-md border border-border p-3 space-y-2 bg-card"

                  >

                    <div className="flex items-start gap-2">

                      <Checkbox

                        id={`section-${section.id}`}

                        checked={section.enabled}

                        onCheckedChange={(checked) =>

                          updateSection(section.id, { enabled: checked === true })

                        }

                      />

                      <div className="flex-1 min-w-0">

                        <label

                          htmlFor={`section-${section.id}`}

                          className="text-sm font-medium leading-tight cursor-pointer"

                        >

                          {ASSIGNMENT_PRINT_SECTION_LABELS[section.id]}

                        </label>

                      </div>

                      <div className="flex gap-1 shrink-0">

                        <Button

                          type="button"

                          variant="outline"

                          size="icon"

                          className="h-7 w-7"

                          disabled={index === 0}

                          onClick={() => moveSection(section.id, -1)}

                          title="Move up"

                        >

                          <ArrowUp className="h-3.5 w-3.5" />

                        </Button>

                        <Button

                          type="button"

                          variant="outline"

                          size="icon"

                          className="h-7 w-7"

                          disabled={index === sortedSections.length - 1}

                          onClick={() => moveSection(section.id, 1)}

                          title="Move down"

                        >

                          <ArrowDown className="h-3.5 w-3.5" />

                        </Button>

                      </div>

                    </div>

                    <Select

                      value={section.region}

                      onValueChange={(value) =>

                        updateSection(section.id, { region: value as AssignmentPrintRegion })

                      }

                      disabled={!section.enabled || draft.columnMode === 'single-column'}

                    >

                      <SelectTrigger className="h-8 text-xs">

                        <SelectValue placeholder="Region" />

                      </SelectTrigger>

                      <SelectContent>

                        {REGION_OPTIONS.map((opt) => (

                          <SelectItem key={opt.value} value={opt.value}>

                            {opt.label}

                          </SelectItem>

                        ))}

                      </SelectContent>

                    </Select>

                  </li>

                ))}

              </ul>

            </div>

          </div>



          <div className="flex flex-col min-h-0 border rounded-md overflow-hidden bg-muted/30">

            <Tabs

              value={previewTab}

              onValueChange={(v) => setPreviewTab(v === 'charge' ? 'charge' : 'assignments')}

              className="flex flex-col flex-1 min-h-0"

            >

              <div className="px-3 py-2 border-b bg-background flex items-center justify-between gap-2">

                <TabsList className="h-8">

                  <TabsTrigger value="assignments" className="text-xs px-3">

                    Assignments preview

                  </TabsTrigger>

                  <TabsTrigger value="charge" className="text-xs px-3">

                    Charge report preview

                  </TabsTrigger>

                </TabsList>

                <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">

                  {draft.orientation} · {draft.stylePreset}

                </span>

              </div>

              <TabsContent value="assignments" className="flex-1 overflow-auto p-2 m-0 min-h-0">

                <style>{previewCss}</style>

                <PrintableAssignments

                  unitName={unitDisplayName}

                  chargeNurseName={chargeNurseName}

                  nurses={nurses}

                  techs={techs}

                  patients={patients}

                  layoutConfig={draft}

                  facilityProfile={facilityProfile}

                  previewMode

                />

              </TabsContent>

              <TabsContent value="charge" className="flex-1 overflow-auto p-2 m-0 min-h-0">

                <style>{previewCss}</style>

                <PrintableReport

                  patients={patients}

                  facilityProfile={facilityProfile}

                  layoutConfig={draft}

                  previewMode

                />

              </TabsContent>

            </Tabs>

          </div>

        </div>



        <DialogFooter className="gap-2 sm:gap-0 flex-wrap">

          <Button type="button" variant="outline" onClick={handleReset}>

            <RotateCcw className="h-4 w-4 mr-2" />

            Reset to default

          </Button>

          <Button type="button" variant="outline" onClick={() => onPrint(draft, 'assignments')}>

            <Printer className="h-4 w-4 mr-2" />

            Print assignments

          </Button>

          <Button type="button" variant="outline" onClick={() => onPrint(draft, 'charge')}>

            <Printer className="h-4 w-4 mr-2" />

            Print charge report

          </Button>

          <Button type="button" onClick={handleSave} disabled={isSaving}>

            Save layout

          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>

  );

}


