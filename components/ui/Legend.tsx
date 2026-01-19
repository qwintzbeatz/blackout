'use client';

const Legend: React.FC = () => {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '10px 12px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 1000,
      maxWidth: '250px',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ fontSize: '10px', color: '#666' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div>
          <span>Your location</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#808080', borderRadius: '50%' }}></div>
          <span>TOY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#FF6B6B', borderRadius: '50%' }}></div>
          <span>VANDAL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#4ECDC4', borderRadius: '50%' }}></div>
          <span>WRITER</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', opacity: 0.2 }}></div>
          <span>50m radius</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#f59e0b', borderRadius: '50%', opacity: 0.1 }}></div>
          <span>GPS accuracy</span>
        </div>
      </div>
    </div>
  );
};

export default Legend;