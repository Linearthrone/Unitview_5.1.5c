"use client";

import React from 'react';
import type { FacilityProfile } from '@/types/facility';
import { formatFacilityAddress } from '@/services/facilityService';
import { cn } from '@/lib/utils';

interface FacilityPrintHeaderProps {
  profile: FacilityProfile;
  subtitle?: string;
  className?: string;
  logoClassName?: string;
}

export default function FacilityPrintHeader({
  profile,
  subtitle,
  className,
  logoClassName,
}: FacilityPrintHeaderProps) {
  const address = formatFacilityAddress(profile);

  return (
    <div className={cn('flex items-start gap-3 mb-3', className)}>
      {profile.logoDataUrl ? (
        <img
          src={profile.logoDataUrl}
          alt=""
          className={cn('h-12 w-auto max-w-[9rem] object-contain shrink-0', logoClassName)}
        />
      ) : null}
      <div className="min-w-0">
        <div className="font-bold text-base leading-tight">{profile.name}</div>
        {address && <div className="text-xs mt-0.5">{address}</div>}
        {profile.phone && <div className="text-xs">{profile.phone}</div>}
        {subtitle && <div className="text-sm mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}
