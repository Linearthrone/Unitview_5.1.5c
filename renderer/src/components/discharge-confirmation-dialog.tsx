
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Patient } from "@/types/patient";

interface DischargeConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  patient: Patient | null;
}

export default function DischargeConfirmationDialog({ open, onOpenChange, onConfirm, patient }: DischargeConfirmationDialogProps) {
  const handleConfirm = () => {
    if (!patient) return;
    onConfirm();
  };

  return (
    <AlertDialog open={open && Boolean(patient)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to discharge this patient?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark <span className="font-bold">{patient?.name}</span> as discharged in {patient?.roomDesignation}. The room stays occupied until transport is complete.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive hover:bg-destructive/90">Discharge</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
