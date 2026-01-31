import React, { useState } from 'react';
import { usePerformance } from '@/src/lib/performance/PerformanceManager';

interface PerformanceSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PerformanceSettingsPanel: React.FC<PerformanceSettingsPanelProps> = ({
  isOpen,
  onClose
}) => {
  const { settings, updateSettings } = usePerformance();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
  };

  const applySettings = () => {
    updateSettings(localSettings);
    onClose();
  };

  const resetToAuto = () => {
    // Force re-detection of device capabilities
    window.location.reload();
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
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        padding: '24px',
        borderRadius: '12px',
        width: 'min(90vw, 400px)',
        maxHeight: '80vh',
        overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          ⚡ Performance Settings
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Max Markers: {localSettings.markerLimit}
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={localSettings.markerLimit}
            onChange={(e) => handleSettingChange('markerLimit', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Update Interval: {Math.round(localSettings.updateInterval / 1000)}s
          </label>
          <input
            type="range"
            min="10000"
            max="120000"
            step="10000"
            value={localSettings.updateInterval}
            onChange={(e) => handleSettingChange('updateInterval', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Max Drops: {localSettings.maxDrops}
          </label>
          <input
            type="range"
            min="10"
            max="200"
            value={localSettings.maxDrops}
            onChange={(e) => handleSettingChange('maxDrops', parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Graphics Quality:
          </label>
          <select
            value={localSettings.graphicsQuality}
            onChange={(e) => handleSettingChange('graphicsQuality', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2a2a2a',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px'
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={localSettings.enableCrewDetection}
              onChange={(e) => handleSettingChange('enableCrewDetection', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Enable Crew Detection
          </label>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={resetToAuto}
            style={{
              padding: '8px 16px',
              backgroundColor: '#666',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Auto-Detect
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#666',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={applySettings}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007acc',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};