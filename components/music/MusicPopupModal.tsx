'use client';

import React from 'react';
import MusicPopupCard from './MusicPopupCard';
import { Drop } from '@/lib/types/blackout';

interface MusicPopupModalProps {
  drop: Drop;
  user: any;
  onLikeUpdate: (dropId: string, newLikes: string[]) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function MusicPopupModal({
  drop,
  user,
  onLikeUpdate,
  onClose,
  isOpen
}: MusicPopupModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 1999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onClose}
      >
        {/* Popup content */}
        <div
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the popup
        >
          <MusicPopupCard
            drop={drop}
            user={user}
            onLikeUpdate={onLikeUpdate}
            onClose={onClose}
            autoPlay={true}
          />
        </div>
      </div>
    </>
  );
}