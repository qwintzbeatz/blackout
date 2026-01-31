import React, { useState, useEffect } from 'react';
import { useErrorHandler } from '@/src/hooks/useErrorHandler';

interface ErrorRecoveryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  error?: Error | null;
  onRetry?: () => void;
}

export const ErrorRecoveryPanel: React.FC<ErrorRecoveryPanelProps> = ({
  isOpen,
  onClose,
  error,
  onRetry
}) => {
  const { reportError, clearErrors, getErrorStats } = useErrorHandler();
  const [recoverySteps, setRecoverySteps] = useState<string[]>([]);

  useEffect(() => {
    if (error) {
      // Generate recovery steps based on error type
      const steps = generateRecoverySteps(error);
      setRecoverySteps(steps);
    }
  }, [error]);

  const generateRecoverySteps = (err: Error): string[] => {
    const steps: string[] = [];
    
    // Network errors
    if (err.message.includes('fetch') || err.message.includes('network')) {
      steps.push('Check your internet connection');
      steps.push('Try switching to mobile data');
      steps.push('Disable VPN if enabled');
    }
    
    // Firebase errors
    if (err.message.includes('permission-denied')) {
      steps.push('Check your login status');
      steps.push('Verify crew permissions');
      steps.push('Try signing out and back in');
    }
    
    // Memory errors
    if (err.message.includes('memory') || err.message.includes('heap')) {
      steps.push('Close other browser tabs');
      steps.push('Restart your browser');
      steps.push('Free up device memory');
    }
    
    // Default steps
    if (steps.length === 0) {
      steps.push('Refresh the page');
      steps.push('Clear browser cache');
      steps.push('Check browser console for details');
      steps.push('Report this issue if it persists');
    }
    
    return steps;
  };

  const handleReportError = async () => {
    if (error) {
      await reportError(error);
      alert('Error reported. Our team will investigate.');
    }
  };

  const handleRetry = () => {
    onClose();
    onRetry?.();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: '#1f2937',
        color: '#ffffff',
        padding: '24px',
        borderRadius: '12px',
        width: 'min(90vw, 450px)',
        maxHeight: '80vh',
        overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '32px', marginRight: '12px' }}>🔧</div>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            Error Recovery
          </h2>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '12px'
          }}>
            <strong>Error:</strong> {error.message}
          </div>
        )}

        {recoverySteps.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              color: '#94a3b8'
            }}>
              Recovery Steps:
            </h3>
            <ol style={{
              margin: 0,
              paddingLeft: '20px',
              color: '#cbd5e1'
            }}>
              {recoverySteps.map((step, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '20px'
        }}>
          <button
            onClick={handleReportError}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Report Issue
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          {onRetry && (
            <button
              onClick={handleRetry}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};