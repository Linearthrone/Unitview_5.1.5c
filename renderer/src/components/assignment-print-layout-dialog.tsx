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
import { ArrowDown, ArrowUp, Printer, RotateCcw } from 'lucide-react';
import PrintableAssignments from './printable-assignments';
import { PRINT_REPORT_CSS } from '@/lib/print-utils';
import type { LayoutName, Patient } from '@/types/patient';
import type { Nurse, PatientCareTech } from '@/types/nurse';
import {
  ASSIGNMENT_PRINT_SECTION_LABELS,
  createDefaultAssignmentPrintLayout,
  sanitizeAssignmentPrintLayout,
  type AssignmentPrintLayoutConfig,
  type AssignmentPrintRegion,
  type AssignmentPrintSectionConfig,
} from '@/types/assignment-print-layout';

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
  onSave: (config: AssignmentPrintLayoutConfig) => Promise<void>;
  onPrint: (config: AssignmentPrintLayoutConfig) => void;
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
  onSave,
  onPrint,
}: AssignmentPrintLayoutDialogProps) {
  const [draft, setDraft] = useState<AssignmentPrintLayoutConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Assignment print layout</DialogTitle>
          <DialogDescription>
            Configure sections, order, and placement for shift assignment printouts on{' '}
            <strong>{layoutName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="column-mode">Page layout</Label>
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
                <SelectTrigger id="column-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="two-column">Two columns (main + sidebar)</SelectItem>
                  <SelectItem value="single-column">Single column (stacked)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sections</Label>
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
            <div className="px-3 py-2 border-b text-sm font-medium bg-background">Live preview</div>
            <div className="flex-1 overflow-auto p-2">
              <style>{PRINT_REPORT_CSS}</style>
              <PrintableAssignments
                unitName={unitDisplayName}
                chargeNurseName={chargeNurseName}
                nurses={nurses}
                techs={techs}
                patients={patients}
                layoutConfig={draft}
                previewMode
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
          <Button type="button" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to default
          </Button>
          <Button type="button" variant="outline" onClick={() => onPrint(draft)}>
            <Printer className="h-4 w-4 mr-2" />
            Print using current layout
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            Save layout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
