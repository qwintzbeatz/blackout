'use client';

import React from 'react';
import { 
  ALL_COLORS, 
  ColorDefinition, 
  isColorUnlocked, 
  getColorStyle,
  STARTER_COLORS,
  STANDARD_COLORS,
  SUPER_COLORS
} from '@/utils/colorUnlocks';
import { panelStyle } from '@/utils';
import { getCrewTheme } from '@/utils/crewTheme';

interface ColorPickerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedColors: string[];
  selectedColor?: string;
  selectedSpecialType?: 'rainbow' | 'glow' | 'metallic' | null;
  onColorSelect: (colorId: string, colorHex: string, specialType?: 'rainbow' | 'glow' | 'metallic' | null) => void;
  crewId?: string | null;
  isSolo?: boolean;
}

const ColorPickerPanel: React.FC<ColorPickerPanelProps> = ({
  isOpen,
  onClose,
  unlockedColors,
  selectedColor,
  onColorSelect,
  crewId,
  isSolo
}) => {
  // Get crew theme for styling
  const crewTheme = getCrewTheme(crewId);
  const crewColor = crewTheme.primary;
  const crewGlow = crewTheme.glow;
  
  // For better visibility with black color
  const crewDisplayColor = crewColor === '#000000' ? '#808080' : crewColor;
  
  const handleColorClick = (color: ColorDefinition) => {
    if (isColorUnlocked(color.id, unlockedColors)) {
      // Pass the special type if the color has one
      const specialType = color.special as 'rainbow' | 'glow' | 'metallic' | null | undefined;
      onColorSelect(color.id, color.hex, specialType);
    }
  };

  const renderColorSwatch = (color: ColorDefinition) => {
    const isUnlocked = isColorUnlocked(color.id, unlockedColors);
    const isSelected = selectedColor === color.hex || selectedColor === color.id;
    
    // Get the style for special colors
    const colorStyle = getColorStyle(color);
    
    return (
      <div
        key={color.id}
        onClick={() => handleColorClick(color)}
        style={{
          position: 'relative',
          width: '50px',
          height: '50px',
          borderRadius: '10px',
          cursor: isUnlocked ? 'pointer' : 'not-allowed',
          border: isSelected ? '3px solid #FFD700' : '2px solid rgba(255,255,255,0.2)',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
          boxShadow: isSelected ? '0 4px 15px rgba(255, 215, 0, 0.4)' : 'none',
          ...colorStyle,
          opacity: isUnlocked ? 1 : 0.4,
        }}
        title={`${color.name}${isUnlocked ? '' : ' (Locked)'}`}
      >
        {/* Glow effect for glow-in-the-dark */}
        {color.special === 'glow' && isUnlocked && (
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '10px',
            boxShadow: `0 0 15px ${color.hex}, inset 0 0 10px rgba(255,255,255,0.3)`,
            pointerEvents: 'none',
          }} />
        )}
        
        {/* Rainbow animation */}
        {color.special === 'rainbow' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)',
            backgroundSize: '200% 100%',
            animation: 'rainbowMove 2s linear infinite',
          }} />
        )}
        
        {/* Metallic shine effect */}
        {color.special === 'metallic' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
            pointerEvents: 'none',
          }} />
        )}
        
        {/* Lock icon for locked colors */}
        {!isUnlocked && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
            <span style={{ fontSize: '16px' }}>🔒</span>
          </div>
        )}
        
        {/* Checkmark for selected color */}
        {isSelected && isUnlocked && (
          <div style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            backgroundColor: '#FFD700',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
          }}>
            ✓
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title: string, colors: ColorDefinition[], icon: string) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#cbd5e1',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {icon} {title}
      </div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        {colors.map(renderColorSwatch)}
      </div>
    </div>
  );

  return (
    <div style={{
      ...panelStyle,
      border: '1px solid #333',
      display: 'flex',
      flexDirection: 'column',
      animation: isOpen ? 'slideInRight 0.3s ease-out' : 'none',
      position: 'absolute' as const,
      zIndex: isOpen ? 1500 : 900,
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? 'auto' : 'none',
      transition: 'opacity 0.3s ease, z-index 0s',
      minWidth: '280px',
      maxWidth: '350px',
      maxHeight: '80vh',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      touchAction: 'auto'
    }}>
      {/* Header - Crew Themed */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        paddingBottom: '10px',
        borderBottom: `1px solid ${crewDisplayColor}40`
      }}>
        <h3 style={{
          margin: 0,
          color: crewDisplayColor,
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>🎨</span>
          SPRAY CAN COLORS
        </h3>
        <button
          onClick={onClose}
          style={{
            background: `${crewDisplayColor}20`,
            border: `1px solid ${crewDisplayColor}40`,
            color: crewDisplayColor,
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>

      {/* Current Selection */}
      <div style={{
        marginBottom: '15px',
        padding: '10px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        border: '1px solid #444'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: selectedColor || '#6B7280',
            border: '2px solid rgba(255,255,255,0.3)',
            boxShadow: selectedColor ? `0 0 10px ${selectedColor}40` : 'none'
          }} />
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Selected Color
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
              {ALL_COLORS.find(c => c.hex === selectedColor || c.id === selectedColor)?.name || 'Grey'}
            </div>
          </div>
        </div>
        
        {isSolo && (
          <div style={{
            marginTop: '10px',
            padding: '8px',
            backgroundColor: 'rgba(107, 114, 128, 0.2)',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#9ca3af',
          }}>
            💡 <strong>Solo players</strong> only have access to Grey. Join a crew to unlock more!
          </div>
        )}
        
        {crewId && !isSolo && (
          <div style={{
            marginTop: '10px',
            padding: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#86efac',
          }}>
            🎯 Your crew colors are unlocked! Earn REP for more.
          </div>
        )}
      </div>

      {/* Colors Grid */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Starter Colors (Crew Colors) */}
        {renderSection('Starter Colors', STARTER_COLORS, '🎯')}
        
        {/* Standard Colors */}
        {renderSection('Spray Can Colors', STANDARD_COLORS, '🖌️')}
        
        {/* Super Unlockables */}
        {renderSection('Special Colors', SUPER_COLORS, '⭐')}
      </div>

      {/* Unlock Info */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
      }}>
        <div style={{ color: '#4dabf7', marginBottom: '6px', fontSize: '12px', fontWeight: 'bold' }}>
          🔓 How to Unlock
        </div>
        <div style={{ 
          fontSize: '10px', 
          color: '#94a3b8',
          lineHeight: '1.5',
        }}>
          <div>• <strong>Starter:</strong> Join a crew</div>
          <div>• <strong>Spray Can:</strong> Earn REP</div>
          <div>• <strong>Special:</strong> Achievements</div>
        </div>
      </div>

      <style>{`
        @keyframes rainbowMove {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        
        @keyframes slideInRight {
          0% { transform: translateX(20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ColorPickerPanel;