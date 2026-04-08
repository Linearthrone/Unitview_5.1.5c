
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Loader2, MoveRight, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseRoomNumberRangeSpec, sequentialRoomNumbers } from '@/lib/room-number-spec';
import type {
  CreateUnitPayload,
  LayoutCardPlacement,
  UnitType,
  LayoutCardKind,
  PrintableCardType,
  PrintableInfoField,
} from '@/types/patient';

interface CreateUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateUnitPayload) => Promise<void>;
  existingLayoutNames: string[];
}

type DraftCard = {
  id: string;
  kind: LayoutCardKind;
  roomIndex?: number;
  /** Set for Room cards; matches step-1 room list / labels */
  roomDisplayNumber?: number;
  label: string;
  row: number | null;
  column: number | null;
};

const UNIT_TYPES: UnitType[] = ['ICU', 'Med-Surg', 'Telemetry', 'Step-Down', 'ER', 'Other'];

const MAX_LAYOUT_ROWS = 30;
const MAX_LAYOUT_COLS = 30;
const DEFAULT_LAYOUT_ROWS = 6;
const DEFAULT_LAYOUT_COLS = 6;
const PRINTABLE_CARD_TYPES: PrintableCardType[] = ['Staff Nurse', 'Patient Care Tech', 'Unit Clerk', 'Charge Nurse'];
const PRINTABLE_INFO_FIELDS: PrintableInfoField[] = [
  'Name',
  'Role',
  'Assigned Rooms',
  'Spectra',
  'Assignment Group',
  'Relief',
  'Notes',
];

function resolveRoomDisplayNumbers(
  numRooms: number,
  firstRoom: number,
  rangeSpec: string
): { numbers: number[] } | { error: string } {
  if (rangeSpec.trim()) {
    return parseRoomNumberRangeSpec(rangeSpec, numRooms);
  }
  if (!Number.isFinite(firstRoom) || firstRoom < 1 || !Number.isInteger(firstRoom)) {
    return { error: 'First room number must be a positive whole number.' };
  }
  return { numbers: sequentialRoomNumbers(firstRoom, numRooms) };
}

function predictCardsAfterPlace(
  prev: DraftCard[],
  roomCardId: string,
  r: number,
  col: number
): DraftCard[] {
  const occupyingCard = prev.find((c) => c.row === r && c.column === col);
  return prev.map((card) => {
    if (card.id === roomCardId) return { ...card, row: r, column: col };
    if (occupyingCard && card.id === occupyingCard.id) return { ...card, row: null, column: null };
    return card;
  });
}

/** Next empty cell after (afterRow, afterCol) in row-major order (uses predicted placements). */
function getNextEmptyRoomInputKey(
  afterRow: number,
  afterCol: number,
  nextCards: DraftCard[],
  layoutRows: number,
  layoutCols: number
): string | null {
  const flatStart = (afterRow - 1) * layoutCols + (afterCol - 1) + 1;
  for (let i = flatStart; i < layoutRows * layoutCols; i++) {
    const rr = Math.floor(i / layoutCols) + 1;
    const cc = (i % layoutCols) + 1;
    const placed = nextCards.some((x) => x.row === rr && x.column === cc);
    if (!placed) return `${rr}-${cc}`;
  }
  return null;
}

/** Previous empty cell before (beforeRow, beforeCol) in row-major order. */
function getPrevEmptyRoomInputKey(
  beforeRow: number,
  beforeCol: number,
  nextCards: DraftCard[],
  layoutRows: number,
  layoutCols: number
): string | null {
  const flatStart = (beforeRow - 1) * layoutCols + (beforeCol - 1) - 1;
  for (let i = flatStart; i >= 0; i--) {
    const rr = Math.floor(i / layoutCols) + 1;
    const cc = (i % layoutCols) + 1;
    const placed = nextCards.some((x) => x.row === rr && x.column === cc);
    if (!placed) return `${rr}-${cc}`;
  }
  return null;
}

export default function CreateUnitDialog({ open, onOpenChange, onSave, existingLayoutNames }: CreateUnitDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [designation, setDesignation] = useState('');
  const [numRooms, setNumRooms] = useState(24);
  const [bedsPerRoom, setBedsPerRoom] = useState(1);
  const [baselineNursesPerShift, setBaselineNursesPerShift] = useState(6);
  const [baselinePctsPerShift, setBaselinePctsPerShift] = useState(2);
  const [nurseToPatientRatio, setNurseToPatientRatio] = useState(4);
  const [unitType, setUnitType] = useState<UnitType>('Med-Surg');
  const [firstRoomNumber, setFirstRoomNumber] = useState(1);
  const [roomRangeSpec, setRoomRangeSpec] = useState('');
  const [cards, setCards] = useState<DraftCard[]>([]);
  const [layoutRows, setLayoutRows] = useState(DEFAULT_LAYOUT_ROWS);
  const [layoutCols, setLayoutCols] = useState(DEFAULT_LAYOUT_COLS);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roomInputAlertOpen, setRoomInputAlertOpen] = useState(false);
  const [roomInputAlertMessage, setRoomInputAlertMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [printCardTypes, setPrintCardTypes] = useState<PrintableCardType[]>(['Staff Nurse', 'Patient Care Tech', 'Unit Clerk', 'Charge Nurse']);
  const [printInfoFields, setPrintInfoFields] = useState<PrintableInfoField[]>(['Name', 'Role', 'Assigned Rooms']);

  const roomInputRefsMap = useRef<Map<string, HTMLInputElement>>(new Map());
  const roomInputToRefocusAfterAlert = useRef<HTMLInputElement | null>(null);
  const skipNextRoomInputBlurRef = useRef(false);

  const totalCardsToPlace =
    numRooms + baselineNursesPerShift + baselinePctsPerShift + 1;
  const layoutCellCount = layoutRows * layoutCols;
  const layoutTooSmall = layoutCellCount < totalCardsToPlace;

  const resolvedRoomNumbers = useMemo((): number[] => {
    const r = resolveRoomDisplayNumbers(numRooms, firstRoomNumber, roomRangeSpec);
    return 'error' in r ? [] : r.numbers;
  }, [numRooms, firstRoomNumber, roomRangeSpec]);

  const allowedRoomNumberSet = useMemo(
    () => new Set(resolvedRoomNumbers),
    [resolvedRoomNumbers]
  );

  useEffect(() => {
    if (open) {
      setStep(1);
      setDesignation('');
      setNumRooms(24);
      setBedsPerRoom(1);
      setBaselineNursesPerShift(6);
      setBaselinePctsPerShift(2);
      setNurseToPatientRatio(4);
      setUnitType('Med-Surg');
      setFirstRoomNumber(1);
      setRoomRangeSpec('');
      setCards([]);
      setLayoutRows(DEFAULT_LAYOUT_ROWS);
      setLayoutCols(DEFAULT_LAYOUT_COLS);
      setDraggingCardId(null);
      setError(null);
      setRoomInputAlertOpen(false);
      setRoomInputAlertMessage('');
      roomInputToRefocusAfterAlert.current = null;
      setIsSaving(false);
      setPrintCardTypes(['Staff Nurse', 'Patient Care Tech', 'Unit Clerk', 'Charge Nurse']);
      setPrintInfoFields(['Name', 'Role', 'Assigned Rooms']);
    }
  }, [open]);

  useEffect(() => {
    if (step !== 2) return;
    setCards((prev) =>
      prev.map((card) =>
        card.row !== null &&
        card.column !== null &&
        (card.row > layoutRows || card.column > layoutCols)
          ? { ...card, row: null, column: null }
          : card
      )
    );
  }, [layoutRows, layoutCols, step]);

  useEffect(() => {
    if (step !== 2) return;
    const roomCards = cards.filter((c) => c.kind === 'Room');
    if (roomCards.length > 0 && roomCards.every((c) => c.row !== null && c.column !== null)) {
      setStep(3);
    }
  }, [cards, step]);

  const validateStepOne = () => {
    setError(null);
    const trimmedDesignation = designation.trim();
    if (!trimmedDesignation) {
      setError('Unit designation cannot be empty.');
      return false;
    }
    if (existingLayoutNames.map(d => d.toLowerCase()).includes(trimmedDesignation.toLowerCase())) {
        setError('A layout with this designation already exists.');
        return false;
    }
    if (trimmedDesignation.includes('/')) {
        setError('Unit designation cannot contain slashes (/).');
        return false;
    }
    if (numRooms <= 0) {
        setError('Number of rooms must be greater than zero.');
        return false;
    }
    if (bedsPerRoom <= 0) {
      setError('Beds per room must be greater than zero.');
      return false;
    }
    if (baselineNursesPerShift < 0 || baselinePctsPerShift < 0) {
      setError('Baseline staffing values cannot be negative.');
      return false;
    }
    if (nurseToPatientRatio <= 0) {
      setError('Nurse-to-patient ratio must be greater than zero.');
      return false;
    }
    const roomNums = resolveRoomDisplayNumbers(numRooms, firstRoomNumber, roomRangeSpec);
    if ('error' in roomNums) {
      setError(roomNums.error);
      return false;
    }
    return true;
  };

  const initializeCards = () => {
    const resolved = resolveRoomDisplayNumbers(numRooms, firstRoomNumber, roomRangeSpec);
    const displayNums = 'error' in resolved ? sequentialRoomNumbers(1, numRooms) : resolved.numbers;
    const roomCards: DraftCard[] = Array.from({ length: numRooms }, (_, idx) => ({
      id: `room-${idx + 1}`,
      kind: 'Room' as const,
      roomIndex: idx + 1,
      roomDisplayNumber: displayNums[idx],
      label: `Room ${displayNums[idx]}`,
      row: null,
      column: null,
    }));
    const nurseCards: DraftCard[] = Array.from({ length: baselineNursesPerShift }, (_, idx) => ({
      id: `nurse-${idx + 1}`,
      kind: 'Staff Nurse' as const,
      label: `Nurse ${idx + 1}`,
      row: null,
      column: null,
    }));
    const pctCards: DraftCard[] = Array.from({ length: baselinePctsPerShift }, (_, idx) => ({
      id: `pct-${idx + 1}`,
      kind: 'Patient Care Tech' as const,
      label: `PCT ${idx + 1}`,
      row: null,
      column: null,
    }));
    const clerkCard: DraftCard = {
      id: 'unit-clerk',
      kind: 'Unit Clerk',
      label: 'Unit Clerk',
      row: null,
      column: null,
    };
    setCards([...roomCards, ...nurseCards, ...pctCards, clerkCard]);
  };

  const handleNext = () => {
    if (!validateStepOne()) return;
    initializeCards();
    setStep(2);
  };

  const handleSave = async () => {
    if (!validateStepOne()) return;
    if (layoutTooSmall) {
      setError(
        `The layout grid is too small: you need at least ${totalCardsToPlace} cells (${numRooms} rooms + ${baselineNursesPerShift} nurses + ${baselinePctsPerShift} PCTs + unit clerk). Increase rows or columns.`
      );
      return;
    }
    if (cards.some(card => card.row === null || card.column === null)) {
      setError('Place every room, nurse, PCT, and Unit Clerk card on the layout map before creating the unit.');
      return;
    }
    if (printCardTypes.length === 0) {
      setError('Select at least one card type for the print layout.');
      return;
    }
    if (printInfoFields.length === 0) {
      setError('Select at least one information field for printed cards.');
      return;
    }

    setIsSaving(true);
    try {
      const roomResolved = resolveRoomDisplayNumbers(numRooms, firstRoomNumber, roomRangeSpec);
      if ('error' in roomResolved) {
        setError(roomResolved.error);
        setIsSaving(false);
        return;
      }
      await onSave({
        designation: designation.trim(),
        numRooms,
        bedsPerRoom,
        baselineNursesPerShift,
        baselinePctsPerShift,
        nurseToPatientRatio,
        unitType,
        roomDisplayNumbers: roomResolved.numbers,
        printLayoutOptions: {
          includedCardTypes: printCardTypes,
          includedInfoFields: printInfoFields,
        },
        cardPlacements: cards.map(
          (card): LayoutCardPlacement => ({
            id: card.id,
            kind: card.kind,
            roomIndex: card.kind === 'Room' ? card.roomIndex : undefined,
            row: card.row || 1,
            column: card.column || 1,
          })
        ),
      });
      onOpenChange(false);
    } catch (e) {
      console.error("Error during unit creation:", e);
      if (e instanceof Error) {
          setError(`Failed to create unit: ${e.message}`);
      } else {
          setError("An unknown error occurred while creating the unit.");
      }
    } finally {
        setIsSaving(false);
    }
  };

  const placeCard = (cardId: string, row: number, column: number) => {
    setCards(prev => {
      const occupyingCard = prev.find(c => c.row === row && c.column === column);
      return prev.map(card => {
        if (card.id === cardId) {
          return { ...card, row, column };
        }
        if (occupyingCard && card.id === occupyingCard.id) {
          return { ...card, row: null, column: null };
        }
        return card;
      });
    });
  };

  type CommitRoomResult =
    | { ok: true; roomCardId?: string }
    | { ok: false; message: string };

  const commitRoomNumberInput = (
    row: number,
    column: number,
    raw: string,
    currentCards: DraftCard[]
  ): CommitRoomResult => {
    const trimmed = raw.trim();
    if (!trimmed) return { ok: true };
    const n = parseInt(trimmed, 10);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      return { ok: false, message: 'Enter a whole room number from your unit list.' };
    }
    if (!allowedRoomNumberSet.has(n)) {
      return { ok: false, message: `Room ${n} is not on this unit's room list.` };
    }
    const roomCard = currentCards.find((c) => c.kind === 'Room' && c.roomDisplayNumber === n);
    if (!roomCard) {
      return { ok: false, message: `Room ${n} could not be matched to a room card.` };
    }
    if (roomCard.row !== null && roomCard.column !== null) {
      if (roomCard.row === row && roomCard.column === column) return { ok: true };
      return { ok: false, message: `Room ${n} is already placed on the map.` };
    }
    placeCard(roomCard.id, row, column);
    return { ok: true, roomCardId: roomCard.id };
  };

  const showRoomInputError = (el: HTMLInputElement, message: string) => {
    setRoomInputAlertMessage(message);
    setRoomInputAlertOpen(true);
    roomInputToRefocusAfterAlert.current = el;
  };

  const handleRoomInputKeyNavigation = (
    row: number,
    column: number,
    el: HTMLInputElement,
    direction: 'next' | 'prev'
  ) => {
    const raw = el.value.trim();
    if (raw) {
      const result = commitRoomNumberInput(row, column, el.value, cards);
      if (!result.ok) {
        showRoomInputError(el, 'message' in result ? result.message : 'Invalid room input.');
        return;
      }
      el.value = '';
      let predicted = cards;
      if (result.roomCardId) {
        predicted = predictCardsAfterPlace(cards, result.roomCardId, row, column);
      }
      const key =
        direction === 'next'
          ? getNextEmptyRoomInputKey(row, column, predicted, layoutRows, layoutCols)
          : getPrevEmptyRoomInputKey(row, column, predicted, layoutRows, layoutCols);
      queueMicrotask(() => {
        if (key) roomInputRefsMap.current.get(key)?.focus();
      });
      return;
    }
    const key =
      direction === 'next'
        ? getNextEmptyRoomInputKey(row, column, cards, layoutRows, layoutCols)
        : getPrevEmptyRoomInputKey(row, column, cards, layoutRows, layoutCols);
    queueMicrotask(() => {
      if (key) roomInputRefsMap.current.get(key)?.focus();
    });
  };

  const clearPlacements = () => {
    setCards(prev => prev.map(card => ({ ...card, row: null, column: null })));
  };

  const roomCards = cards.filter((c) => c.kind === 'Room');
  const staffCards = cards.filter((c) => c.kind !== 'Room');
  const roomPlacedCount = roomCards.filter((c) => c.row !== null && c.column !== null).length;
  const staffPlacedCount = staffCards.filter((c) => c.row !== null && c.column !== null).length;
  const allRoomsPlaced = roomCards.length > 0 && roomCards.every((c) => c.row !== null && c.column !== null);
  const allStaffPlaced = staffCards.length > 0 && staffCards.every((c) => c.row !== null && c.column !== null);

  const togglePrintCardType = (value: PrintableCardType) => {
    setPrintCardTypes((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  };

  const togglePrintInfoField = (value: PrintableInfoField) => {
    setPrintInfoFields((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  };
  
  return (
    <>
    <AlertDialog
      open={roomInputAlertOpen}
      onOpenChange={(nextOpen) => {
        setRoomInputAlertOpen(nextOpen);
        if (!nextOpen) {
          queueMicrotask(() => {
            const el = roomInputToRefocusAfterAlert.current;
            roomInputToRefocusAfterAlert.current = null;
            el?.focus();
          });
        }
      }}
    >
      <AlertDialogContent className="z-[100]">
        <AlertDialogHeader>
          <AlertDialogTitle>Room number</AlertDialogTitle>
          <AlertDialogDescription className="text-left text-foreground">
            {roomInputAlertMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction type="button">OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex max-h-[92vh] w-[min(95vw,48rem)] min-h-[220px] min-w-[min(100%,280px)] max-w-[min(98vw,72rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(98vw,72rem)]',
          'resize'
        )}
      >
        <div className="shrink-0 px-6 pt-6 pr-14">
          <DialogHeader>
            <DialogTitle>Create New Unit</DialogTitle>
            <DialogDescription>
              Step {step} of 4:{' '}
              {step === 1
                ? 'Unit details'
                : step === 2
                  ? 'Place room cards'
                  : step === 3
                    ? 'Place nurse, PCA, and unit clerk cards'
                    : 'Choose print layout options'}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="grid gap-4 py-4">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="unit-designation">Unit Designation / Name</Label>
                <Input
                  id="unit-designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g., 8th Floor, 10C, West Wing"
                  disabled={isSaving}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="num-rooms">Number of Rooms</Label>
                  <Input
                    id="num-rooms"
                    type="number"
                    value={numRooms}
                    onChange={(e) => setNumRooms(parseInt(e.target.value, 10) || 0)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first-room-number">First room number</Label>
                  <Input
                    id="first-room-number"
                    type="number"
                    min={1}
                    step={1}
                    value={firstRoomNumber}
                    onChange={(e) => setFirstRoomNumber(parseInt(e.target.value, 10) || 0)}
                    disabled={isSaving || !!roomRangeSpec.trim()}
                  />
                  <p className="text-xs text-muted-foreground">
                    Consecutive room labels (e.g. 801, 802…). Disabled if you use a custom list below.
                  </p>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="room-range-spec">Custom room numbers (optional)</Label>
                  <Input
                    id="room-range-spec"
                    value={roomRangeSpec}
                    onChange={(e) => setRoomRangeSpec(e.target.value)}
                    placeholder='e.g. 801-824 or 801,803,805-812'
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must list exactly as many rooms as &quot;Number of Rooms&quot;. Overrides first room number. Use commas between entries; ranges are inclusive.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beds-per-room">Beds Per Room</Label>
                  <Input
                    id="beds-per-room"
                    type="number"
                    value={bedsPerRoom}
                    onChange={(e) => setBedsPerRoom(parseInt(e.target.value, 10) || 0)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseline-nurses">Baseline Nurses / Shift</Label>
                  <Input
                    id="baseline-nurses"
                    type="number"
                    value={baselineNursesPerShift}
                    onChange={(e) => setBaselineNursesPerShift(parseInt(e.target.value, 10) || 0)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseline-pcts">Baseline PCTs / Shift</Label>
                  <Input
                    id="baseline-pcts"
                    type="number"
                    value={baselinePctsPerShift}
                    onChange={(e) => setBaselinePctsPerShift(parseInt(e.target.value, 10) || 0)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nurse-ratio">Nurse-to-Patient Ratio</Label>
                  <Input
                    id="nurse-ratio"
                    type="number"
                    value={nurseToPatientRatio}
                    onChange={(e) => setNurseToPatientRatio(parseInt(e.target.value, 10) || 0)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit-type">Unit Type</Label>
                  <Select value={unitType} onValueChange={(value) => setUnitType(value as UnitType)}>
                    <SelectTrigger id="unit-type">
                      <SelectValue placeholder="Select unit type" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : step === 4 ? (
            <div className="space-y-4">
              <div className="rounded-md border p-3">
                <div className="text-sm font-semibold">Printed card types</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose which cards appear on the printed assignment layout.
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRINTABLE_CARD_TYPES.map((cardType) => (
                    <label key={cardType} className="flex items-center gap-2 rounded border px-2 py-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={printCardTypes.includes(cardType)}
                        onChange={() => togglePrintCardType(cardType)}
                        disabled={isSaving}
                      />
                      {cardType}
                    </label>
                  ))}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-sm font-semibold">Information fields on printed cards</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Select the details to include on each printed card.
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRINTABLE_INFO_FIELDS.map((field) => (
                    <label key={field} className="flex items-center gap-2 rounded border px-2 py-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={printInfoFields.includes(field)}
                        onChange={() => togglePrintInfoField(field)}
                        disabled={isSaving}
                      />
                      {field}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid min-h-0 grid-cols-[1fr_2fr] gap-4 sm:min-h-[320px]">
              <div className="min-h-0 space-y-3 overflow-y-auto rounded-md border p-3">
                <div className="space-y-2 rounded-md border border-dashed bg-muted/20 p-2">
                  <div className="text-xs font-semibold">Layout grid size</div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Rows and columns set how many slots appear on the map. Each slot becomes one position on the unit board (max {MAX_LAYOUT_ROWS}×{MAX_LAYOUT_COLS}).
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="layout-rows" className="text-xs">
                        Rows
                      </Label>
                      <Input
                        id="layout-rows"
                        type="number"
                        min={1}
                        max={MAX_LAYOUT_ROWS}
                        step={1}
                        value={layoutRows}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!Number.isFinite(v)) return;
                          setLayoutRows(Math.min(MAX_LAYOUT_ROWS, Math.max(1, v)));
                        }}
                        disabled={isSaving}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="layout-cols" className="text-xs">
                        Columns
                      </Label>
                      <Input
                        id="layout-cols"
                        type="number"
                        min={1}
                        max={MAX_LAYOUT_COLS}
                        step={1}
                        value={layoutCols}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!Number.isFinite(v)) return;
                          setLayoutCols(Math.min(MAX_LAYOUT_COLS, Math.max(1, v)));
                        }}
                        disabled={isSaving}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <p
                    className={cn(
                      'text-[11px]',
                      layoutTooSmall ? 'text-destructive font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {totalCardsToPlace} cards to place · {layoutCellCount} grid cells
                    {layoutTooSmall
                      ? ` — need at least ${totalCardsToPlace} cells`
                      : null}
                  </p>
                </div>
                <div className="text-sm font-semibold">Cards to place</div>
                <p className="text-xs text-muted-foreground">
                  {step === 2
                    ? 'Place all room cards first. You can drag from the list or type a room number in an empty grid cell. Tab or Enter accepts and moves to the next empty cell; Shift+Tab goes to the previous.'
                    : 'Place nurse, PCA, and unit clerk cards on the map after room placement is complete. One card per grid cell.'}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={clearPlacements}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Clear Placements
                </Button>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Room cards ({numRooms})</div>
                    <div className="space-y-1.5">
                      {step === 2 && cards.filter(c => c.kind === 'Room').map(card => (
                        <div
                          key={card.id}
                          draggable
                          onDragStart={() => setDraggingCardId(card.id)}
                          onDragEnd={() => setDraggingCardId(null)}
                          className="rounded border border-green-600/40 bg-green-500/10 px-2 py-1 text-sm cursor-grab"
                        >
                          {card.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  {step === 3 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Nurse assignment cards ({baselineNursesPerShift})</div>
                    <div className="space-y-1.5">
                      {cards.filter(c => c.kind === 'Staff Nurse').map(card => (
                        <div
                          key={card.id}
                          draggable
                          onDragStart={() => setDraggingCardId(card.id)}
                          onDragEnd={() => setDraggingCardId(null)}
                          className="rounded border border-blue-600/40 bg-blue-500/10 px-2 py-1 text-sm cursor-grab"
                        >
                          {card.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  )}
                  {step === 3 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">PCT cards ({baselinePctsPerShift})</div>
                    <div className="space-y-1.5">
                      {cards.filter(c => c.kind === 'Patient Care Tech').map(card => (
                        <div
                          key={card.id}
                          draggable
                          onDragStart={() => setDraggingCardId(card.id)}
                          onDragEnd={() => setDraggingCardId(null)}
                          className="rounded border border-amber-600/40 bg-amber-500/10 px-2 py-1 text-sm cursor-grab"
                        >
                          {card.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  )}
                  {step === 3 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Unit clerk</div>
                    <div className="space-y-1.5">
                      {cards.filter(c => c.kind === 'Unit Clerk').map(card => (
                        <div
                          key={card.id}
                          draggable
                          onDragStart={() => setDraggingCardId(card.id)}
                          onDragEnd={() => setDraggingCardId(null)}
                          className="rounded border border-violet-600/40 bg-violet-500/10 px-2 py-1 text-sm cursor-grab"
                        >
                          {card.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  )}
                </div>
              </div>
              <div className="min-h-0 min-w-0 space-y-2 overflow-y-auto">
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${layoutCols}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: layoutRows * layoutCols }).map((_, idx) => {
                    const row = Math.floor(idx / layoutCols) + 1;
                    const column = (idx % layoutCols) + 1;
                    const placedCard = cards.find(card => card.row === row && card.column === column);
                    return (
                      <div
                        key={`${row}-${column}`}
                        className="min-h-20 rounded border border-dashed p-2 bg-muted/25"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggingCardId) {
                            placeCard(draggingCardId, row, column);
                          }
                        }}
                      >
                        <div className="text-[10px] text-muted-foreground">R{row} C{column}</div>
                        {placedCard && (
                          <div
                            className={cn(
                              'mt-2 rounded px-2 py-1 text-xs border',
                              placedCard.kind === 'Room' && 'border-green-600/50 bg-green-500/10',
                              placedCard.kind === 'Staff Nurse' && 'border-blue-600/50 bg-blue-500/10',
                              placedCard.kind === 'Patient Care Tech' && 'border-amber-600/50 bg-amber-500/10',
                              placedCard.kind === 'Unit Clerk' && 'border-violet-600/50 bg-violet-500/10',
                            )}
                          >
                            {placedCard.label}
                          </div>
                        )}
                        {!placedCard && step === 2 && (
                          <Input
                            ref={(el) => {
                              const key = `${row}-${column}`;
                              if (el) roomInputRefsMap.current.set(key, el);
                              else roomInputRefsMap.current.delete(key);
                            }}
                            className="mt-1.5 h-7 text-xs"
                            placeholder="Room #"
                            inputMode="numeric"
                            disabled={isSaving}
                            aria-label={`Type room number for row ${row} column ${column}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                skipNextRoomInputBlurRef.current = true;
                                handleRoomInputKeyNavigation(row, column, e.currentTarget, 'next');
                                return;
                              }
                              if (e.key === 'Tab') {
                                e.preventDefault();
                                skipNextRoomInputBlurRef.current = true;
                                handleRoomInputKeyNavigation(
                                  row,
                                  column,
                                  e.currentTarget,
                                  e.shiftKey ? 'prev' : 'next'
                                );
                              }
                            }}
                            onBlur={(e) => {
                              if (skipNextRoomInputBlurRef.current) {
                                skipNextRoomInputBlurRef.current = false;
                                return;
                              }
                              const el = e.currentTarget;
                              const raw = el.value.trim();
                              if (!raw) return;
                              const result = commitRoomNumberInput(row, column, el.value, cards);
                              if (!result.ok) {
                                showRoomInputError(el, 'message' in result ? result.message : 'Invalid room input.');
                                return;
                              }
                              el.value = '';
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          </div>
          {error && <p className="text-sm text-destructive pt-1">{error}</p>}
        </div>
        <div className="shrink-0 border-t px-6 py-4">
          <DialogFooter>
          <DialogClose asChild>
             <Button type="button" variant="secondary" disabled={isSaving}>
                Cancel
             </Button>
          </DialogClose>
          {step === 1 ? (
            <Button type="button" onClick={handleNext} disabled={isSaving}>
              <MoveRight className="mr-2 h-4 w-4" />
              Next: Place Rooms
            </Button>
          ) : step === 2 ? (
            <Button
              type="button"
              disabled
              title="This step advances automatically after all rooms are placed."
            >
              {allRoomsPlaced
                ? 'Advancing to staff cards...'
                : `Place all rooms (${roomPlacedCount}/${numRooms})`}
            </Button>
          ) : step === 3 ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                disabled={isSaving}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep(4)}
                disabled={isSaving || !allStaffPlaced}
              >
                <MoveRight className="mr-2 h-4 w-4" />
                Next: Print Layout ({staffPlacedCount}/{staffCards.length})
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
                disabled={isSaving}
              >
                Back
              </Button>
              <Button type="button" onClick={handleSave} disabled={isSaving || layoutTooSmall}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-4 w-4" />
                    Create Unit
                  </>
                )}
              </Button>
            </>
          )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
