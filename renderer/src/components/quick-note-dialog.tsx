"use client";

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Patient } from '@/types/patient';

interface QuickNoteDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (patientId: string, noteText: string) => void;
}

export default function QuickNoteDialog({
  patient,
  open,
  onOpenChange,
  onAccept,
}: QuickNoteDialogProps) {
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (open) setNoteText('');
  }, [open, patient?.id]);

  if (!patient) return null;

  const handleAccept = () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    onAccept(patient.id, trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick note</DialogTitle>
          <DialogDescription>
            Add a note for {patient.roomDesignation}. Timestamp and your employee ID will be appended on save.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="quick-note-text">Note</Label>
          <Textarea
            id="quick-note-text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enter quick note…"
            rows={4}
            className="resize-none"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Discard
          </Button>
          <Button type="button" onClick={handleAccept} disabled={!noteText.trim()}>
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
