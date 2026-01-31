import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: true
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    this.props.onReset?.();
  };

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#0f172a',
          color: 'white',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px'
        }}>
          <div style={{ fontSize: '48px' }}>🚨</div>
          <h2 style={{ color: '#ef4444' }}>Blackout NZ Crashed</h2>
          <p style={{ color: '#cbd5e1', maxWidth: '400px' }}>
            The street art got too real. Our system needs a reset.
          </p>
          
          {this.state.error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              padding: '15px',
              borderRadius: '8px',
              maxWidth: '500px',
              textAlign: 'left',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <strong>Error:</strong> {this.state.error.message}
              {this.state.errorInfo && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Component Stack:</strong>
                  <pre style={{ whiteSpace: 'pre-wrap', marginTop: '5px' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Try Again
            </button>
            <button
              onClick={this.handleRetry}
              style={{
                backgroundColor: 'transparent',
                color: '#64748b',
                border: '1px solid #475569',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Reload App
            </button>
          </div>

          <div style={{
            marginTop: '30px',
            fontSize: '12px',
            color: '#64748b',
            maxWidth: '400px'
          }}>
            <strong>Tip:</strong> If this keeps happening, try:
            <ul style={{ textAlign: 'left', marginTop: '8px', paddingLeft: '20px' }}>
              <li>Refresh the page</li>
              <li>Clear browser cache</li>
              <li>Check your internet connection</li>
              <li>Switch to a different crew</li>
            </ul>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}