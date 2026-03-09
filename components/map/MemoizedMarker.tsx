'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserMarker } from '@/lib/types/blackout';
import { getLayeredIconForMarker } from '@/components/map/LayeredMarkerIcon';

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

interface MemoizedMarkerProps {
  marker: UserMarker;
  user: FirebaseUser | null;
  onClick: (marker: UserMarker) => void;
  crewId?: string | null;
  activeStyleId?: string;
  activeUsername?: string;
}

const MemoizedMarkerComponent: React.FC<MemoizedMarkerProps> = ({
  marker,
  user: _user,
  onClick,
  crewId
}) => {
  const customIcon = useMemo(() => {
    if (typeof window === 'undefined') return undefined;

    // Fonts are intentionally disabled on the map. Convert any *-font style to svg variant 1.
    const styleId = marker.styleId || '';
    const fontStyleMatch = styleId.match(/^([a-z0-9]+)-([a-z0-9]+)-font$/i);
    const effectiveStyleId = fontStyleMatch
      ? `${fontStyleMatch[1].toLowerCase()}-${fontStyleMatch[2].toLowerCase()}-svg-1`
      : styleId;

    const variantMatch = effectiveStyleId.match(/-svg-(\d+)$/);
    const variant = variantMatch ? parseInt(variantMatch[1], 10) : 1;
    const styleCrewId = effectiveStyleId.split('-')[0];

    return getLayeredIconForMarker({
      color: marker.color,
      surface: marker.surface,
      graffitiType: marker.graffitiType,
      specialType: marker.specialType,
      crewId: styleCrewId || crewId || 'bqc',
      playerTagName: undefined,
      styleId: effectiveStyleId || undefined,
      variant
    });
  }, [
    marker.color,
    marker.styleId,
    marker.surface,
    marker.graffitiType,
    marker.specialType,
    crewId
  ]);

  return (
    <Marker
      position={marker.position}
      icon={customIcon}
      eventHandlers={{ click: () => onClick(marker) }}
    />
  );
};

export const MemoizedMarker = React.memo(MemoizedMarkerComponent);
MemoizedMarker.displayName = 'MemoizedMarker';

export default MemoizedMarker;

