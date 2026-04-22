"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type UnitTheme = 'light' | 'dark' | 'blue' | 'green' | 'purple';

export interface EditUnitValues {
  name: string;
  theme: UnitTheme;
}

interface EditUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: EditUnitValues | null;
  existingLayoutNames: string[];
  onSave: (values: EditUnitValues) => Promise<void> | void;
}

const THEMES: UnitTheme[] = ['light', 'dark', 'blue', 'green', 'purple'];

export default function EditUnitDialog({
  open,
  onOpenChange,
  initialValues,
  existingLayoutNames,
  onSave,
}: EditUnitDialogProps) {
  const [name, setName] = useState('');
  const [theme, setTheme] = useState<UnitTheme>('light');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || !initialValues) return;
    setName(initialValues.name);
    setTheme(initialValues.theme);
    setError(null);
    setIsSaving(false);
  }, [open, initialValues]);

  const handleSave = async () => {
    if (!initialValues) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Unit name cannot be empty.');
      return;
    }
    if (trimmedName.includes('/')) {
      setError('Unit name cannot contain slashes (/).');
      return;
    }
    const duplicate = existingLayoutNames.some(
      (layoutName) => layoutName.toLowerCase() === trimmedName.toLowerCase() && layoutName !== initialValues.name
    );
    if (duplicate) {
      setError('A unit with this name already exists.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({ name: trimmedName, theme });
      onOpenChange(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save unit changes.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Unit</DialogTitle>
          <DialogDescription>Update this unit name or theme.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-unit-name">Unit name</Label>
            <Input
              id="edit-unit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 10C West Wing"
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-unit-theme">Theme</Label>
            <Select value={theme} onValueChange={(value) => setTheme(value as UnitTheme)}>
              <SelectTrigger id="edit-unit-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEMES.map((themeValue) => (
                  <SelectItem key={themeValue} value={themeValue}>
                    {themeValue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
