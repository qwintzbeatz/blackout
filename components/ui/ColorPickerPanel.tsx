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

interface ColorPickerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedColors: string[];
  selectedColor?: string;
  onColorSelect: (colorId: string, colorHex: string) => void;
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
  if (!isOpen) return null;

  const handleColorClick = (color: ColorDefinition) => {
    if (isColorUnlocked(color.id, unlockedColors)) {
      onColorSelect(color.id, color.hex);
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
          width: '60px',
          height: '60px',
          borderRadius: '12px',
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
            <span style={{ fontSize: '20px' }}>🔒</span>
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
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
          }}>
            ✓
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title: string, colors: ColorDefinition[], icon: string) => (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#cbd5e1',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {icon} {title}
      </h3>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        {colors.map(renderColorSwatch)}
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 2000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '20px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            🎨 Spray Can Colors
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Current Selection Info */}
        <div style={{
          padding: '15px 20px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: selectedColor || '#6B7280',
              border: '2px solid rgba(255,255,255,0.3)',
            }} />
            <div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                Selected Color
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                {ALL_COLORS.find(c => c.hex === selectedColor || c.id === selectedColor)?.name || 'Grey'}
              </div>
            </div>
          </div>
          
          {isSolo && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              backgroundColor: 'rgba(107, 114, 128, 0.2)',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#9ca3af',
            }}>
              💡 <strong>Solo players</strong> only have access to Grey. Join a crew to unlock more colors!
            </div>
          )}
          
          {crewId && !isSolo && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#86efac',
            }}>
              🎯 Your crew colors are unlocked! Earn REP to unlock more.
            </div>
          )}
        </div>

        {/* Colors Grid */}
        <div style={{ padding: '20px' }}>
          {/* Starter Colors (Crew Colors) */}
          {renderSection('Starter Colors', STARTER_COLORS, '🎯')}
          
          {/* Standard Colors */}
          {renderSection('Spray Can Colors', STANDARD_COLORS, '🖌️')}
          
          {/* Super Unlockables */}
          {renderSection('Special Colors', SUPER_COLORS, '⭐')}
          
          {/* Unlock Info */}
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}>
            <h4 style={{ color: '#4dabf7', marginBottom: '8px', fontSize: '14px' }}>
              🔓 How to Unlock Colors
            </h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '20px', 
              fontSize: '13px', 
              color: '#94a3b8',
              lineHeight: '1.6',
            }}>
              <li><strong>Starter Colors:</strong> Join a crew to get 2 colors</li>
              <li><strong>Spray Can Colors:</strong> Earn REP and complete missions</li>
              <li><strong>Special Colors:</strong> Complete special achievements</li>
            </ul>
          </div>
        </div>

        {/* Close Button */}
        <div style={{
          padding: '15px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 30px',
              background: 'linear-gradient(135deg, #4dabf7, #3b82f6)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            Done
          </button>
        </div>
      </div>

      <style>{`
        @keyframes rainbowMove {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
};

export default ColorPickerPanel;