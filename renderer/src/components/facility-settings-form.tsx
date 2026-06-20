"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Building2, ImagePlus, Trash2 } from 'lucide-react';
import type { FacilityProfile } from '@/types/facility';
import {
  defaultFacilityProfile,
  getFacilityProfile,
  saveFacilityProfile,
} from '@/services/facilityService';

const MAX_LOGO_BYTES = 512_000;

export default function FacilitySettingsForm() {
  const [profile, setProfile] = useState<FacilityProfile>(defaultFacilityProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await getFacilityProfile();
        if (!cancelled) setProfile(loaded);
      } catch {
        if (!cancelled) showMessage('error', 'Failed to load facility settings.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showMessage]);

  const updateField = (field: keyof FacilityProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      showMessage('error', 'Logo must be 512 KB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfile((prev) => ({ ...prev, logoDataUrl: reader.result as string }));
      }
    };
    reader.onerror = () => showMessage('error', 'Could not read logo file.');
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setProfile((prev) => ({ ...prev, logoDataUrl: undefined }));
  };

  const handleSave = async () => {
    const name = profile.name.trim();
    if (!name) {
      showMessage('error', 'Facility name is required.');
      return;
    }
    setIsSaving(true);
    try {
      await saveFacilityProfile({ ...profile, name });
      showMessage('success', 'Facility settings saved. Logo and name will appear on printouts.');
    } catch {
      showMessage('error', 'Failed to save facility settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">Loading facility settings…</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Facility profile
        </CardTitle>
        <CardDescription>
          Name and logo appear on login, charge reports, assignment printouts, and exported documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {message && (
          <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="facility-name">Facility name</Label>
            <Input
              id="facility-name"
              value={profile.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Memorial Hospital — North Campus"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="facility-address1">Address line 1</Label>
            <Input
              id="facility-address1"
              value={profile.addressLine1 ?? ''}
              onChange={(e) => updateField('addressLine1', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="facility-address2">Address line 2</Label>
            <Input
              id="facility-address2"
              value={profile.addressLine2 ?? ''}
              onChange={(e) => updateField('addressLine2', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facility-city">City</Label>
            <Input
              id="facility-city"
              value={profile.city ?? ''}
              onChange={(e) => updateField('city', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facility-state">State</Label>
            <Input id="facility-state" value={profile.state ?? ''} onChange={(e) => updateField('state', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facility-zip">ZIP</Label>
            <Input id="facility-zip" value={profile.zip ?? ''} onChange={(e) => updateField('zip', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facility-phone">Phone</Label>
            <Input id="facility-phone" value={profile.phone ?? ''} onChange={(e) => updateField('phone', e.target.value)} />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-dashed p-4">
          <Label>Company logo</Label>
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-24 w-40 items-center justify-center rounded-md border bg-muted/30 overflow-hidden">
              {profile.logoDataUrl ? (
                <img src={profile.logoDataUrl} alt="Facility logo preview" className="max-h-full max-w-full object-contain p-2" />
              ) : (
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoUpload} />
              <p className="text-xs text-muted-foreground">PNG, JPG, WebP, or SVG · max 512 KB</p>
              {profile.logoDataUrl && (
                <Button type="button" variant="outline" size="sm" onClick={handleRemoveLogo}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove logo
                </Button>
              )}
            </div>
          </div>
        </div>

        <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save facility settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
