import { useState, useCallback } from 'react';
import { ErrorInfo } from 'react';

interface ErrorReport {
  id: string;
  error: Error;
  errorInfo?: ErrorInfo;
  timestamp: Date;
  userAgent: string;
  url: string;
  userId?: string;
  crewId?: string;
}

export const useErrorHandler = (userId?: string, crewId?: string) => {
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [isReporting, setIsReporting] = useState(false);

  const reportError = useCallback(async (error: Error, errorInfo?: ErrorInfo) => {
    const errorReport: ErrorReport = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      error,
      errorInfo,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId,
      crewId
    };

    // Add to local state
    setErrors(prev => [...prev, errorReport]);

    // Log to console with structured data
    console.error('Error reported:', {
      id: errorReport.id,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: errorReport.userAgent,
      url: errorReport.url,
      userId: errorReport.userId,
      timestamp: errorReport.timestamp.toISOString()
    });

    // Send to analytics (if available)
    if (typeof window !== 'undefined') {
      // Google Analytics
      if ((window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: false,
          custom_map: {
            error_id: errorReport.id,
            user_id: userId || 'anonymous',
            crew_id: crewId || 'none'
          }
        });
      }

      // Custom error tracking
      try {
        await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorReport)
        });
      } catch (fetchError) {
        console.warn('Failed to report error to server:', fetchError);
      }
    }

    return errorReport.id;
  }, [userId, crewId]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const retryAction = useCallback(async (action: () => Promise<any>, retries = 3) => {
    let lastError: Error | null = new Error('Unknown error');

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await action();
        return { success: true, attempts: attempt };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retries) {
          // Report final error after all retries failed
          await reportError(lastError);
          return { success: false, attempts: retries, error: lastError };
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.warn(`Retry attempt ${attempt} failed:`, (error as Error).message);
      }
    }

    return { success: false, attempts: 0, error: lastError || new Error('Unknown error') };
  }, [reportError]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    errorHandler?: (error: Error) => void
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      const err = error as Error;
      
      if (errorHandler) {
        errorHandler(err);
      } else {
        await reportError(err);
      }
      
      return null;
    }
  }, [reportError]);

  const getErrorStats = useCallback(() => {
    const last24Hours = errors.filter(e => 
      Date.now() - e.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    return {
      totalErrors: errors.length,
      recentErrors: last24Hours.length,
      uniqueErrors: new Set(errors.map(e => e.error.message)).size,
      errorRate: last24Hours.length / 24 // errors per hour
    };
  }, [errors]);

  return {
    errors,
    isReporting,
    reportError,
    clearErrors,
    retryAction,
    handleAsyncError,
    getErrorStats,
    hasRecentErrors: errors.some(e => 
      Date.now() - e.timestamp.getTime() < 5 * 60 * 1000 // last 5 minutes
    )
  };
};