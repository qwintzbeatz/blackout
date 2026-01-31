'use client';

import React, { useState } from 'react';

interface Props {
  children: React.ReactNode;
}

export const ErrorTest: React.FC<Props> = ({ children }) => {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test error for ErrorBoundary');
  }

  return (
    <div>
      <button
        onClick={() => setShouldError(true)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          margin: '10px'
        }}
      >
        Trigger Test Error
      </button>
      {children}
    </div>
  );
};

export default ErrorTest;