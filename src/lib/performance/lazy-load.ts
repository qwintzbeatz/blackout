// Lazy loading utility for code splitting optimization
// Reduces initial bundle size by loading heavy components on demand

import React, { lazy, Suspense, type ReactNode } from 'react';

// Re-export Suspense for convenience
export { Suspense };

// Loading fallback component
export function LazyLoadFallback(): ReactNode {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: '#94a3b8'
      }
    },
    React.createElement('div', {
      style: {
        width: '24px',
        height: '24px',
        border: '3px solid #333',
        borderTop: '3px solid #4dabf7',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }
    })
  );
}

// Wrapper component for lazy loading with Suspense
interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps): ReactNode {
  return React.createElement(
    Suspense,
    { fallback: fallback || React.createElement(LazyLoadFallback) },
    children
  );
}

// Lazy-loaded panel components
// These will be code-split and loaded on-demand
export const CrewChatPanelLazy = lazy(() => 
  import('@/components/chat/CrewChatPanel').then(mod => ({ default: (mod as any).default || mod }))
);

export const ProfilePanelLazy = lazy(() => 
  import('@/components/profile/ProfilePanel').then(mod => ({ default: (mod as any).default || mod }))
);

export const MusicPanelLazy = lazy(() => 
  import('@/components/music/MusicPopupModal').then(mod => ({ default: (mod as any).default || mod }))
);

export const PhotosPanelLazy = lazy(() => 
  import('@/components/photo/PhotoDropPopup').then(mod => ({ default: (mod as any).default || mod }))
);

export const DirectMessagingLazy = lazy(() => 
  import('@/components/DirectMessaging').then(mod => ({ default: (mod as any).default || mod }))
);
