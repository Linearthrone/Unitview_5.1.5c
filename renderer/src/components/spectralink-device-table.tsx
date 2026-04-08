"use client";

import React, { useMemo, useState } from "react";
import type { Nurse, PatientCareTech, Spectra, SpectraStatus } from "@/types/nurse";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
}

export default function SpectralinkDeviceTable({
  title = "Spectralink Devices",
  spectraPool,
  nurses,
  techs,
  onAssignDevice,
  onUnassignDevice,
  onSetStatus,
  onAddLog,
}: SpectralinkDeviceTableProps) {
  const [draggingDeviceId, setDraggingDeviceId] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<{ x: number; y: number; deviceId: string } | null>(null);
  const [logDialogDeviceId, setLogDialogDeviceId] = useState<string | null>(null);

  const assignableStaff = useMemo(
    () =>
      [...nurses, ...techs]
        .map((staff) => ({ id: staff.id, name: staff.name, role: "role" in staff ? staff.role : "Patient Care Tech" }))
        .filter((staff) => Boolean(staff.name && staff.name.trim())),
    [nurses, techs]
  );

  const selectedLogDevice = useMemo(
    () => spectraPool.find((device) => device.id === logDialogDeviceId) ?? null,
    [logDialogDeviceId, spectraPool]
  );

  const handleContextAction = (action: string, device: Spectra) => {
    if (action.startsWith("status:")) {
      const status = action.slice("status:".length) as SpectraStatus;
      onSetStatus(device.id, status);
      return;
    }
    if (action === "view-logs") {
      setLogDialogDeviceId(device.id);
      return;
    }
    if (action === "add-log") {
      const message = window.prompt(`Add a log for ${device.id}:`);
      if (message) onAddLog(device.id, message);
      return;
    }
    if (action === "unassign") {
      onUnassignDevice(device.id);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        <Badge variant="outline">{spectraPool.length} devices</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="p-2">Device</th>
              <th className="p-2">Status</th>
              <th className="p-2">Assigned</th>
              <th className="p-2">Logs</th>
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
                  <td className="p-2">{device.logs?.length ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Drag a device row and drop on staff
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {assignableStaff.map((staff) => (
            <div
              key={staff.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const spectraId = e.dataTransfer.getData("text/plain");
                if (spectraId) onAssignDevice(spectraId, staff.name);
                setDraggingDeviceId(null);
              }}
              className="rounded-md border border-dashed border-muted-foreground/40 bg-background p-2 text-xs"
            >
              <div className="font-medium">{staff.name}</div>
              <div className="text-muted-foreground">{staff.role}</div>
            </div>
          ))}
        </div>
      </div>

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
          <div className="flex justify-end">
            <Button type="button" onClick={() => setLogDialogDeviceId(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
