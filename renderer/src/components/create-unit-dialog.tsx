
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Loader2, MoveRight, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseRoomNumberRangeSpec, sequentialRoomNumbers } from '@/lib/room-number-spec';
import type { CreateUnitPayload, LayoutCardPlacement, UnitType, LayoutCardKind } from '@/types/patient';

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
  label: string;
  row: number | null;
  column: number | null;
};

const UNIT_TYPES: UnitType[] = ['ICU', 'Med-Surg', 'Telemetry', 'Step-Down', 'ER', 'Other'];
const LAYOUT_ROWS = 6;
const LAYOUT_COLS = 6;

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

export default function CreateUnitDialog({ open, onOpenChange, onSave, existingLayoutNames }: CreateUnitDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
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
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
      setDraggingCardId(null);
      setError(null);
      setIsSaving(false);
    }
  }, [open]);

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
    if (cards.some(card => card.row === null || card.column === null)) {
      setError('Place every room, nurse, PCT, and Unit Clerk card on the layout map before creating the unit.');
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

  const clearPlacements = () => {
    setCards(prev => prev.map(card => ({ ...card, row: null, column: null })));
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Unit</DialogTitle>
          <DialogDescription>
            Step {step} of 2: {step === 1 ? 'Unit details' : 'Place rooms, then staff cards on the map'}
          </DialogDescription>
        </DialogHeader>
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
          ) : (
            <div className="grid grid-cols-[1fr_2fr] gap-4 max-h-[70vh]">
              <div className="space-y-3 rounded-md border p-3 overflow-y-auto">
                <div className="text-sm font-semibold">Cards to place</div>
                <p className="text-xs text-muted-foreground">
                  Order: place all room cards, then nurse assignment cards, then PCT cards, then the Unit Clerk. One card per grid cell.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={clearPlacements}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Clear Placements
                </Button>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Room cards ({numRooms})</div>
                    <div className="space-y-1.5">
                      {cards.filter(c => c.kind === 'Room').map(card => (
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
                </div>
              </div>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${LAYOUT_COLS}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: LAYOUT_ROWS * LAYOUT_COLS }).map((_, idx) => {
                  const row = Math.floor(idx / LAYOUT_COLS) + 1;
                  const column = (idx % LAYOUT_COLS) + 1;
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>
          {error && <p className="text-sm text-destructive pt-1">{error}</p>}
        <DialogFooter>
          <DialogClose asChild>
             <Button type="button" variant="secondary" disabled={isSaving}>
                Cancel
             </Button>
          </DialogClose>
          {step === 1 ? (
            <Button type="button" onClick={handleNext} disabled={isSaving}>
              <MoveRight className="mr-2 h-4 w-4" />
              Next: Define Layout
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isSaving}>
                Back
              </Button>
              <Button type="button" onClick={handleSave} disabled={isSaving}>
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
      </DialogContent>
    </Dialog>
  );
}
