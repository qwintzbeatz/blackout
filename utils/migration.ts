// Migration Utilities for Blackout NZ
// Handles migration of existing markers to new surface/graffiti type system

import { UserMarker } from '@/types';
import { 
  migrateMarkerNameToSurface, 
  migrateMarkerDescriptionToGraffiti 
} from './typeMapping';
import { calculateRep } from './repCalculator';

/**
 * Migrates an existing marker to the new surface/graffiti type system
 */
export function migrateMarker(marker: UserMarker): UserMarker {
  // If marker already has new fields, return as-is
  if (marker.surface && marker.graffitiType) {
    return marker;
  }

  // Migrate old name/description to new surface/graffiti types
  const surface = migrateMarkerNameToSurface(marker.name);
  const graffitiType = migrateMarkerDescriptionToGraffiti(marker.description);

  // Calculate new REP using advanced system
  const repResult = calculateRep(surface, graffitiType, {
    isHeaven: ['rooftop', 'bridge'].includes(surface),
    isMovingTarget: ['train', 'truck', 'van'].includes(surface),
    isHighRisk: ['speed_camera', 'traffic_light'].includes(surface),
    hasStreakBonus: marker.distanceFromCenter !== undefined && marker.distanceFromCenter <= 50
  });

  return {
    ...marker,
    surface,
    graffitiType,
    repBreakdown: repResult.breakdown,
    // Update rep to new calculated value
    repEarned: repResult.rep,
    // Mark as migrated
    isEdited: true
  };
}

/**
 * Migrates an array of markers
 */
export function migrateMarkers(markers: UserMarker[]): UserMarker[] {
  return markers.map(migrateMarker);
}

/**
 * Checks if a marker needs migration
 */
export function needsMigration(marker: UserMarker): boolean {
  return !marker.surface || !marker.graffitiType;
}

/**
 * Gets migration statistics for a batch of markers
 */
export function getMigrationStats(markers: UserMarker[]): {
  total: number;
  needsMigration: number;
  alreadyMigrated: number;
  migrationPercentage: number;
} {
  const total = markers.length;
  const needsMigrateCount = markers.filter(needsMigration).length;
  const alreadyMigratedCount = total - needsMigrateCount;
  const migrationPercentage = total > 0 ? (alreadyMigratedCount / total) * 100 : 0;

  return {
    total,
    needsMigration: needsMigrateCount,
    alreadyMigrated: alreadyMigratedCount,
    migrationPercentage
  };
}

/**
 * Validates a migrated marker
 */
export function validateMigratedMarker(marker: UserMarker): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!marker.surface) {
    errors.push('Missing surface type');
  }

  if (!marker.graffitiType) {
    errors.push('Missing graffiti type');
  }

  if (!marker.repBreakdown) {
    errors.push('Missing REP breakdown');
  }

  if (marker.repEarned === undefined || marker.repEarned === null) {
    errors.push('Missing REP earned');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Bulk migration with validation
 */
export function bulkMigrateWithValidation(markers: UserMarker[]): {
  migratedMarkers: UserMarker[];
  successCount: number;
  failureCount: number;
  errors: Array<{ markerId: string; errors: string[] }>;
} {
  const results = markers.map((marker) => {
    try {
      const migrated = migrateMarker(marker);
      const validation = validateMigratedMarker(migrated);
      
      return {
        marker: migrated,
        success: validation.isValid,
        errors: validation.errors
      };
    } catch (error) {
      return {
        marker,
        success: false,
        errors: [`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  });

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  const errors = results
    .filter(r => !r.success)
    .map(r => ({
      markerId: r.marker.id,
      errors: r.errors
    }));

  return {
    migratedMarkers: results.map(r => r.marker),
    successCount,
    failureCount,
    errors
  };
}