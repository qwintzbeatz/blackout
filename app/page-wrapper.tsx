import React from 'react';
import { EnhancedErrorBoundary } from '@/src/components/ui/EnhancedErrorBoundary';
import { useErrorHandler } from '@/src/hooks/useErrorHandler';
import Home from './page';

const AppWithErrorBoundary: React.FC = () => {
  const { hasRecentErrors } = useErrorHandler();

  return (
    <EnhancedErrorBoundary
      onReset={() => {
        // Clear any cached errors and reload
        window.location.reload();
      }}
    >
      <Home />
    </EnhancedErrorBoundary>
  );
};

export default AppWithErrorBoundary;