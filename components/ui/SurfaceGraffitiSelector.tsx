'use client';

import React from 'react';
import { SurfaceType, GraffitiType } from '@/types';
import { getSurfaceOptions, getGraffitiTypeOptions, getQuickRepPreview } from '@/utils/typeMapping';

interface SurfaceGraffitiSelectorProps {
  selectedSurface: SurfaceType;
  selectedGraffitiType: GraffitiType;
  onSurfaceChange: (surface: SurfaceType) => void;
  onGraffitiTypeChange: (graffitiType: GraffitiType) => void;
  disabled?: boolean;
}

export const SurfaceGraffitiSelector: React.FC<SurfaceGraffitiSelectorProps> = ({
  selectedSurface,
  selectedGraffitiType,
  onSurfaceChange,
  onGraffitiTypeChange,
  disabled = false
}) => {
  const surfaceOptions = getSurfaceOptions();
  const graffitiOptions = getGraffitiTypeOptions();
  
  const currentRepPreview = getQuickRepPreview(selectedSurface, selectedGraffitiType);

  return (
    <div className="space-y-4">
      {/* Surface Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📍 Surface Type
        </label>
        <select
          value={selectedSurface}
          onChange={(e) => onSurfaceChange(e.target.value as SurfaceType)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {surfaceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.icon} {option.label} (Base: {option.baseRep} REP)
            </option>
          ))}
        </select>
      </div>

      {/* Graffiti Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🎨 Graffiti Type
        </label>
        <select
          value={selectedGraffitiType}
          onChange={(e) => onGraffitiTypeChange(e.target.value as GraffitiType)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {graffitiOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.icon} {option.label} (Base: {option.baseRep} REP)
            </option>
          ))}
        </select>
      </div>

      {/* REP Preview */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Base REP Preview:</span>
          <span className="text-lg font-bold text-blue-600">{currentRepPreview}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Final REP will include bonuses for distance, streak, surface risk, and graffiti difficulty
        </div>
      </div>
    </div>
  );
};

export default SurfaceGraffitiSelector;