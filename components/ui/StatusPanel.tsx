'use client';

interface StatusPanelProps {
  isTracking: boolean;
  userMarkersCount: number;
  accuracy: number | null;
  speed: number | null;
}

const StatusPanel: React.FC<StatusPanelProps> = ({
  isTracking,
  userMarkersCount,
  accuracy,
  speed
}) => {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 1000,
      maxWidth: '250px',
      backdropFilter: 'blur(10px)'
    }}>
      <h4 style={{ 
        margin: '0 0 8px 0', 
        fontSize: '13px', 
        color: isTracking ? '#10b981' : '#f59e0b',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span>{isTracking ? '📍' : '⚠️'}</span>
        {isTracking ? 'Live GPS Tracking' : 'Tracking Paused'}
      </h4>
      <div style={{ fontSize: '11px', color: '#666' }}>
        <div style={{ marginBottom: '4px' }}>
          <strong>Markers placed:</strong> {userMarkersCount}
        </div>
        {accuracy && (
          <div style={{ marginBottom: '4px' }}>
            <strong>GPS Accuracy:</strong> ~{Math.round(accuracy)}m
          </div>
        )}
        {speed !== null && speed > 0 && (
          <div style={{ marginBottom: '4px' }}>
            <strong>Speed:</strong> {(speed * 3.6).toFixed(1)} km/h
          </div>
        )}
        <div style={{ marginTop: '5px', fontSize: '10px', color: '#4dabf7' }}>
          Click on map to add markers!
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;