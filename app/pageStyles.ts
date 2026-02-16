/**
 * Page-level styles for app/page.tsx
 * Extracted from inline styles to reduce code duplication
 */

// Common layout styles
export const fullScreenStyle = {
  height: '100vh',
  width: '100vw',
};

export const fixedPositionStyle = {
  position: 'fixed' as const,
  zIndex: 1000,
};

// Loading spinner
export const loadingSpinnerStyle = {
  width: '50px',
  height: '50px',
  border: '5px solid #f3f3f3',
  borderTop: '5px solid #4dabf7',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

// Card/Panel base styles
export const panelBaseStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  borderRadius: '8px',
  padding: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

// Button base styles
export const buttonBaseStyle = {
  padding: '10px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  transition: 'all 0.3s ease',
};

// Primary button (blue)
export const primaryButtonStyle = {
  ...buttonBaseStyle,
  background: 'linear-gradient(135deg, #4dabf7, #3b82f6)',
  color: 'white',
  border: 'none',
};

// Secondary button (gray)
export const secondaryButtonStyle = {
  ...buttonBaseStyle,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: '#cbd5e1',
  border: '1px solid rgba(255, 255, 255, 0.2)',
};

// Success button (green)
export const successButtonStyle = {
  ...buttonBaseStyle,
  background: 'linear-gradient(135deg, #10b981, #059669)',
  color: 'white',
  border: 'none',
};

// Danger button (red)
export const dangerButtonStyle = {
  ...buttonBaseStyle,
  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
  color: 'white',
  border: 'none',
};

// Form input base
export const inputBaseStyle = {
  padding: '14px 18px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '10px',
  fontSize: '15px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: 'white',
  outline: 'none',
};

// Grid utilities
export const grid2ColStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '12px',
};

export const grid3ColStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '12px',
};

// Flex utilities
export const flexCenterStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export const flexBetweenStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

export const flexColumnStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '12px',
};

// Text styles
export const titleTextStyle = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'white',
};

export const subtitleTextStyle = {
  fontSize: '14px',
  color: '#cbd5e1',
};

export const smallTextStyle = {
  fontSize: '12px',
  color: '#94a3b8',
};

// Color scheme
export const colors = {
  primary: '#4dabf7',    // Blue
  secondary: '#10b981',  // Green
  accent: '#f59e0b',     // Amber
  danger: '#ef4444',     // Red
  purple: '#8a2be2',     // Purple
  pink: '#ec4899',       // Pink
  surface: '#1e293b',    // Dark surface
  background: '#0f172a', // Dark background
};

// Gradients
export const gradients = {
  primary: 'linear-gradient(135deg, #4dabf7, #3b82f6)',
  success: 'linear-gradient(135deg, #10b981, #059669)',
  danger: 'linear-gradient(135deg, #dc2626, #b91c1c)',
  purple: 'linear-gradient(135deg, #8a2be2, #6a1bb2)',
};

// Animation keyframes (to be used in global CSS)
// @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
// @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
// @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
