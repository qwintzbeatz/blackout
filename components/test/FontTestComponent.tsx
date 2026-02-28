'use client';

import React, { useState } from 'react';
import { getLayeredIconForMarker } from '@/components/map/LayeredMarkerIcon';
import { getStyleById } from '@/constants/graffitiFonts';

interface FontTestComponentProps {
  onTestComplete: () => void;
}

export const FontTestComponent: React.FC<FontTestComponentProps> = ({ onTestComplete }) => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const runTests = async () => {
    setIsTesting(true);
    const results: string[] = [];
    
    try {
      // Test 1: Check if fonts are loading
      results.push('🧪 Testing font loading...');
      
      // Test different styles
      const testStyles = [
        'bqc-tag-font',
        'bqc-mops-font', 
        'sps-tag-font',
        'lzt-tag-font',
        'dgc-tag-font'
      ];

      for (const styleId of testStyles) {
        const style = getStyleById(styleId);
        if (style) {
          results.push(`✅ Found style: ${style.name} (${style.styleType})`);
          
          // Test icon creation
          try {
            const icon = getLayeredIconForMarker({
              surface: 'wall',
              graffitiType: style.graffitiType,
              playerTagName: 'TESTTAG',
              styleId: styleId,
              color: '#ff6b35'
            });
            results.push(`✅ Created icon for ${style.name}`);
          } catch (error) {
            results.push(`❌ Failed to create icon for ${style.name}: ${error}`);
          }
        } else {
          results.push(`❌ Style not found: ${styleId}`);
        }
      }

      // Test 2: Check font availability
      results.push('🧪 Testing font availability...');
      
      // Check if font files exist
      const fontFiles = [
        '/fonts/bqc/tag.woff2',
        '/fonts/bqc/mops.woff2',
        '/fonts/sps/tag.woff2'
      ];

      for (const fontFile of fontFiles) {
        try {
          const response = await fetch(fontFile);
          if (response.ok) {
            results.push(`✅ Font file exists: ${fontFile}`);
          } else {
            results.push(`❌ Font file missing: ${fontFile}`);
          }
        } catch (error) {
          results.push(`❌ Error checking font file ${fontFile}: ${error}`);
        }
      }

      // Test 3: Test different marker configurations
      results.push('🧪 Testing marker configurations...');
      
      const testConfigs = [
        { surface: 'wall', graffitiType: 'tag', playerTagName: 'PLAYER1' },
        { surface: 'pole', graffitiType: 'stencil', playerTagName: 'PLAYER2' },
        { surface: 'fence', graffitiType: 'throwup', playerTagName: 'PLAYER3' }
      ];

      for (const config of testConfigs) {
        try {
          const icon = getLayeredIconForMarker({
            ...config,
            styleId: 'bqc-tag-font',
            color: '#4dabf7'
          });
          results.push(`✅ Created marker for ${config.graffitiType} on ${config.surface}`);
        } catch (error) {
          results.push(`❌ Failed to create marker for ${config.graffitiType}: ${error}`);
        }
      }

      results.push('🎉 All tests completed!');
      
    } catch (error) {
      results.push(`❌ Test failed: ${error}`);
    } finally {
      setTestResults(results);
      setIsTesting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '300px',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      color: 'white',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      zIndex: 2000,
      maxHeight: '80vh',
      overflowY: 'auto',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', color: '#4dabf7' }}>Font Test Panel</h3>
        <button
          onClick={onTestComplete}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ✕
        </button>
      </div>

      <button
        onClick={runTests}
        disabled={isTesting}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: isTesting ? '#666' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isTesting ? 'not-allowed' : 'pointer',
          marginBottom: '12px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        {isTesting ? '🧪 Testing...' : '🧪 Run Font Tests'}
      </button>

      <div style={{
        fontSize: '11px',
        lineHeight: '1.4',
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        {testResults.map((result, index) => (
          <div key={index} style={{ marginBottom: '4px' }}>
            {result}
          </div>
        ))}
      </div>

      {testResults.length > 0 && (
        <div style={{
          marginTop: '12px',
          fontSize: '10px',
          color: '#94a3b8',
          textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '8px'
        }}>
          Font styles should now be visible on map markers
        </div>
      )}
    </div>
  );
};

export default FontTestComponent;