"use client";

import React, { useMemo, useState } from "react";
import type { Nurse, PatientCareTech, Spectra, SpectraStatus } from "@/types/nurse";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: SpectraStatus[] = [
  "in service",
  "out of service",
  "lost",
  "damaged",
  "being repaired",
];

interface SpectralinkDeviceTableProps {
  title?: string;
  spectraPool: Spectra[];
  nurses: Nurse[];
  techs: PatientCareTech[];
  onAssignDevice: (spectraId: string, staffName: string) => void;
  onUnassignDevice: (spectraId: string) => void;
  onSetStatus: (spectraId: string, status: SpectraStatus) => void;
  onAddLog: (spectraId: string, message: string) => void;
  /** Role-gated Spectra pool management (§3.5.3 / §6.2.2). */
  onManageSpectra?: () => void;
  canManageSpectra?: boolean;
  /** Device log actions are admin-only per checklist §6.1.10. */
  canManageDeviceLogs?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** When set, header collapse control notifies the parent (e.g. sidebar handle-only mode). */
  onRequestCollapse?: () => void;
  /** Drop-device-on-staff grid columns (default 2; 3 on wide shift board). */
  staffDropColumns?: 2 | 3;
}

export default function SpectralinkDeviceTable({
  title = "Spectra",
  spectraPool,
  nurses,
  techs,
  onAssignDevice,
  onUnassignDevice,
  onSetStatus,
  onAddLog,
  onManageSpectra,
  canManageSpectra = false,
  canManageDeviceLogs = false,
  collapsible = true,
  defaultCollapsed = false,
  onRequestCollapse,
  staffDropColumns = 2,
}: SpectralinkDeviceTableProps) {
  const [draggingDeviceId, setDraggingDeviceId] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<{ x: number; y: number; deviceId: string } | null>(null);
  const [logDialogDeviceId, setLogDialogDeviceId] = useState<string | null>(null);
  const [addLogDeviceId, setAddLogDeviceId] = useState<string | null>(null);
  const [addLogMessage, setAddLogMessage] = useState("");
  const [addLogError, setAddLogError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const assignableStaff = useMemo(
    () =>
      [...nurses, ...techs]
        .map((staff) => ({ id: staff.id, name: staff.name, role: "role" in staff ? staff.role : "Patient Care Tech" }))
        .filter((staff) => Boolean(staff.name && staff.name.trim())),
    [nurses, techs]
  );

  const deviceByStaffName = useMemo(() => {
    const map = new Map<string, string>();
    for (const device of spectraPool) {
      const assignee = device.assignedTo?.trim();
      if (assignee) map.set(assignee, device.id);
    }
    return map;
  }, [spectraPool]);

  const selectedLogDevice = useMemo(
    () => spectraPool.find((device) => device.id === logDialogDeviceId) ?? null,
    [logDialogDeviceId, spectraPool]
  );

  const addLogDevice = useMemo(
    () => spectraPool.find((device) => device.id === addLogDeviceId) ?? null,
    [addLogDeviceId, spectraPool]
  );

  const handleContextAction = (action: string, device: Spectra) => {
    if (action.startsWith("status:")) {
      const status = action.slice("status:".length) as SpectraStatus;
      onSetStatus(device.id, status);
      return;
    }
    if (action === "view-logs" && canManageDeviceLogs) {
      setLogDialogDeviceId(device.id);
      return;
    }
    if (action === "add-log" && canManageDeviceLogs) {
      setAddLogDeviceId(device.id);
      setAddLogMessage("");
      setAddLogError(null);
      return;
    }
    if (action === "unassign") {
      onUnassignDevice(device.id);
    }
  };

  const handleSubmitAddLog = () => {
    const trimmed = addLogMessage.trim();
    if (!trimmed) {
      setAddLogError("Log message cannot be empty.");
      return;
    }
    if (addLogDeviceId) {
      onAddLog(addLogDeviceId, trimmed);
    }
    setAddLogDeviceId(null);
    setAddLogMessage("");
    setAddLogError(null);
  };

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {collapsible && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => {
                if (onRequestCollapse) {
                  onRequestCollapse();
                } else {
                  setCollapsed((v) => !v);
                }
              }}
              aria-label={collapsed && !onRequestCollapse ? "Expand Spectra panel" : "Collapse Spectra panel"}
            >
              {collapsed && !onRequestCollapse ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {title}
          </h3>
          <Badge variant="outline" className="shrink-0">{spectraPool.length}</Badge>
        </div>
        {canManageSpectra && onManageSpectra && (
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onManageSpectra}>
            <ListTodo className="h-4 w-4 mr-1.5" />
            Manage pool
          </Button>
        )}
      </div>

      {(!collapsed || onRequestCollapse) && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden p-3">
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-2">Device</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Assigned</th>
                  {canManageDeviceLogs && <th className="p-2">Logs</th>}
                </tr>
              </thead>
              <tbody>
                {spectraPool.map((device) => {
                  const status = device.status ?? (device.inService ? "in service" : "out of service");
                  return (
                    <tr
                      key={device.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggingDeviceId(device.id);
                        e.dataTransfer.setData("application/x-unitview-spectra", device.id);
                        e.dataTransfer.setData("text/plain", device.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => setDraggingDeviceId(null)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setMenuState({ x: e.clientX, y: e.clientY, deviceId: device.id });
                      }}
                      className={cn(
                        "border-b last:border-b-0",
                        draggingDeviceId === device.id && "opacity-50",
                        "cursor-grab active:cursor-grabbing"
                      )}
                    >
                      <td className="p-2 font-medium">{device.id}</td>
                      <td className="p-2 capitalize">{status}</td>
                      <td className="p-2">{device.assignedTo || "Unassigned"}</td>
                      {canManageDeviceLogs && (
                        <td className="p-2">{device.logs?.length ?? 0}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 shrink-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Drop device on staff
            </p>
            <div
              className={cn(
                "grid gap-2",
                staffDropColumns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2",
              )}
            >
              {assignableStaff.map((staff) => {
                const assignedDeviceId = deviceByStaffName.get(staff.name.trim());
                return (
                <div
                  key={staff.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const spectraId =
                      e.dataTransfer.getData("application/x-unitview-spectra") ||
                      e.dataTransfer.getData("text/plain");
                    if (spectraId) onAssignDevice(spectraId, staff.name);
                    setDraggingDeviceId(null);
                  }}
                  className={cn(
                    "rounded-md border border-dashed p-2 text-xs",
                    assignedDeviceId
                      ? "border-primary/50 bg-primary/5"
                      : "border-muted-foreground/40 bg-background",
                  )}
                >
                  <div className="font-medium truncate">{staff.name}</div>
                  <div className="text-muted-foreground truncate">{staff.role}</div>
                  {assignedDeviceId ? (
                    <div className="mt-1 font-medium text-primary truncate">{assignedDeviceId}</div>
                  ) : (
                    <div className="mt-1 text-muted-foreground">Drop device here</div>
                  )}
                </div>
              );
              })}
            </div>
          </div>
        </div>
      )}

      {menuState ? (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => setMenuState(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenuState(null);
          }}
        />
      ) : null}
      {menuState ? (
        <div
          className="fixed z-50 min-w-[14rem] rounded-md border bg-popover p-1 shadow-lg"
          style={{ top: menuState.y, left: menuState.x }}
        >
          {(() => {
            const device = spectraPool.find((item) => item.id === menuState.deviceId);
            if (!device) return null;
            return (
              <>
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="block w-full rounded px-2 py-1 text-left text-sm capitalize hover:bg-accent"
                    onClick={() => {
                      handleContextAction(`status:${status}`, device);
                      setMenuState(null);
                    }}
                  >
                    Set status: {status}
                  </button>
                ))}
                {canManageDeviceLogs && (
                  <>
                    <div className="my-1 border-t" />
                    <button
                      type="button"
                      className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                      onClick={() => {
                        handleContextAction("view-logs", device);
                        setMenuState(null);
                      }}
                    >
                      View device logs
                    </button>
                    <button
                      type="button"
                      className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                      onClick={() => {
                        handleContextAction("add-log", device);
                        setMenuState(null);
                      }}
                    >
                      Add device log
                    </button>
                  </>
                )}
                <div className="my-1 border-t" />
                <button
                  type="button"
                  className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    handleContextAction("unassign", device);
                    setMenuState(null);
                  }}
                >
                  Unassign device
                </button>
              </>
            );
          })()}
        </div>
      ) : null}

      <Dialog open={Boolean(selectedLogDevice)} onOpenChange={(open) => !open && setLogDialogDeviceId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Device Logs - {selectedLogDevice?.id}</DialogTitle>
            <DialogDescription>Chronological service and handoff notes for this device.</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {selectedLogDevice?.logs?.length ? (
              [...selectedLogDevice.logs]
                .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
                .map((log) => (
                  <div key={log.id} className="rounded border p-2 text-sm">
                    <div className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</div>
                    <div>{log.message}</div>
                  </div>
                ))
            ) : (
              <div className="text-sm text-muted-foreground">No logs for this device yet.</div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setLogDialogDeviceId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(addLogDevice)}
        onOpenChange={(open) => {
          if (!open) {
            setAddLogDeviceId(null);
            setAddLogMessage("");
            setAddLogError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add device log — {addLogDevice?.id}</DialogTitle>
            <DialogDescription>Record a service note for this Spectralink device.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="spectra-log-message">Log message</Label>
            <Input
              id="spectra-log-message"
              value={addLogMessage}
              onChange={(e) => setAddLogMessage(e.target.value)}
              placeholder="e.g., Battery replaced"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmitAddLog();
                }
              }}
            />
            {addLogError && <p className="text-sm text-destructive">{addLogError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setAddLogDeviceId(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmitAddLog}>
              Save log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
