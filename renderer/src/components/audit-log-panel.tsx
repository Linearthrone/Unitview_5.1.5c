import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { ClipboardList } from 'lucide-react';

interface AuditRow {
  id?: string;
  timestamp?: string;
  action?: string;
  actorEmployeeNumber?: string;
  resourceType?: string;
  resourceId?: string;
  success?: boolean;
  detail?: string;
}

export default function AuditLogPanel() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!window.electronAPI?.listAudit) {
      setError('Audit history is available in the desktop application.');
      return;
    }
    const result = await window.electronAPI.listAudit(100);
    if (!result.success) {
      setError(result.error || 'Could not load audit log');
      return;
    }
    setError(null);
    setRows((result.records ?? []) as AuditRow[]);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Access audit log
          </CardTitle>
          <CardDescription>
            HIPAA audit controls — employee number, action, and resource id only. Names and MRNs are
            redacted.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
        {!error && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice().reverse().map((row, index) => (
                <TableRow key={row.id ?? `${row.timestamp}-${index}`}>
                  <TableCell className="whitespace-nowrap text-xs">{row.timestamp}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.actorEmployeeNumber ?? '—'}</TableCell>
                  <TableCell>
                    {[row.resourceType, row.resourceId].filter(Boolean).join(' ') || row.detail || '—'}
                  </TableCell>
                  <TableCell>{row.success ? 'OK' : 'Denied'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
