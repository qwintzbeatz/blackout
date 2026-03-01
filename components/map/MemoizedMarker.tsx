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

    return getLayeredIconForMarker({
      color: marker.color,
      styleId: marker.styleId,
      playerTagName: marker.username,
      surface: marker.surface,
      graffitiType: marker.graffitiType,
      specialType: marker.specialType,
      crewId
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

