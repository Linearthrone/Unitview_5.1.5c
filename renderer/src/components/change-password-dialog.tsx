import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { MIN_PASSWORD_LENGTH, validatePasswordPolicy } from '@/lib/password-policy';

interface ChangePasswordDialogProps {
  open: boolean;
  employeeNumber: string;
  required?: boolean;
  onSubmit: (password: string) => Promise<{ ok: boolean; error?: string }>;
}

export default function ChangePasswordDialog({
  open,
  employeeNumber,
  required = false,
  onSubmit,
}: ChangePasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    const policy = validatePasswordPolicy(password, employeeNumber);
    if (!policy.ok) {
      setError(policy.errors[0] ?? 'Password does not meet policy');
      return;
    }
    setIsSaving(true);
    const result = await onSubmit(password);
    setIsSaving(false);
    if (!result.ok) {
      setError(result.error ?? 'Could not change password');
      return;
    }
    setPassword('');
    setConfirm('');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={required ? undefined : undefined}>
      <DialogContent
        onInteractOutside={(event) => {
          if (required) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (required) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{required ? 'Create a secure password' : 'Change password'}</DialogTitle>
          <DialogDescription>
            Use at least {MIN_PASSWORD_LENGTH} characters with a letter and a number. Do not reuse
            your employee number.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save password'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
