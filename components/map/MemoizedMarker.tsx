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
}

const MemoizedMarkerComponent: React.FC<MemoizedMarkerProps> = ({
  marker,
  user,
  onClick,
  crewId
}) => {
  const customIcon = useMemo(() => {
    if (typeof window === 'undefined') return undefined;

    // Extract variant from styleId (e.g., "bqc-tag-svg-3" -> 3)
    const variantMatch = marker.styleId?.match(/-svg-(\d+)$/);
    const variant = variantMatch ? parseInt(variantMatch[1], 10) : 1;

    // DEBUG: Log what's happening
    console.log('🎯 Marker styleId:', marker.styleId, '-> variant:', variant);

    return getLayeredIconForMarker({
      color: marker.color,
      surface: marker.surface,
      graffitiType: marker.graffitiType,
      specialType: marker.specialType,
      crewId: crewId || 'bqc',
      // Always show SVG icon in badge, never username text
      playerTagName: undefined,
      variant
    });
  }, [
    marker.color,
    marker.styleId,
    marker.username,
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

