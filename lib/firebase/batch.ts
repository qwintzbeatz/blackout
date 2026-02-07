// Firestore Batch Operations Utility
// Optimizes database writes by batching multiple operations

import { writeBatch, doc, DocumentReference } from 'firebase/firestore';

// Type for Firestore database (will be injected)
let db: any = null;

export function setDb(database: any): void {
  db = database;
}

// Batch operation queue
interface BatchOperation {
  type: 'set' | 'update' | 'delete';
  ref: DocumentReference;
  data?: Record<string, unknown>;
}

class BatchManager {
  private queue: BatchOperation[] = [];
  private maxBatchSize = 500; // Firestore limit
  private flushThreshold = 100; // Flush when queue reaches this size

  // Add set operation to queue
  set(ref: DocumentReference, data: Record<string, unknown>): void {
    this.queue.push({ type: 'set', ref, data });
    this.checkFlush();
  }

  // Add update operation to queue
  update(ref: DocumentReference, data: Record<string, unknown>): void {
    this.queue.push({ type: 'update', ref, data });
    this.checkFlush();
  }

  // Add delete operation to queue
  delete(ref: DocumentReference): void {
    this.queue.push({ type: 'delete', ref });
    this.checkFlush();
  }

  // Check if we need to flush
  private checkFlush(): void {
    if (this.queue.length >= this.flushThreshold) {
      this.flush().catch(err => console.error('Batch flush error:', err));
    }
  }

  // Flush queue to Firestore
  async flush(): Promise<void> {
    if (this.queue.length === 0 || !db) return;

    const batch = writeBatch(db);
    const operationsToProcess = [...this.queue];
    this.queue = [];

    for (const op of operationsToProcess) {
      switch (op.type) {
        case 'set':
          batch.set(op.ref, op.data);
          break;
        case 'update':
          if (op.data) batch.update(op.ref, op.data);
          break;
        case 'delete':
          batch.delete(op.ref);
          break;
      }
    }

    await batch.commit();
  }

  // Get queue size
  size(): number {
    return this.queue.length;
  }

  // Clear queue without processing
  clear(): void {
    this.queue = [];
  }
}

// Singleton instance
export const batchManager = new BatchManager();

// Convenience functions for common batch operations

// Batch update multiple user stats
export async function batchUpdateUserStats(
  userUpdates: Array<{ userId: string; data: Record<string, unknown> }>
): Promise<void> {
  const batch = writeBatch(db);
  
  for (const { userId, data } of userUpdates) {
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, data);
  }
  
  await batch.commit();
}

// Batch update marker likes
export async function batchUpdateMarkerLikes(
  markerLikes: Array<{ markerId: string; likes: string[] }>
): Promise<void> {
  const batch = writeBatch(db);
  
  for (const { markerId, likes } of markerLikes) {
    const markerRef = doc(db, 'markers', markerId);
    batch.update(markerRef, { likes });
  }
  
  await batch.commit();
}

// Batch delete old markers (cleanup)
export async function batchDeleteOldMarkers(
  markerIds: string[],
  olderThan: Date
): Promise<void> {
  const batch = writeBatch(db);
  
  for (const markerId of markerIds) {
    const markerRef = doc(db, 'markers', markerId);
    batch.delete(markerRef);
  }
  
  await batch.commit();
}

// Debounced batch utility for rapid updates
export function createDebouncedBatch(
  flushInterval: number = 1000
): {
  add: (ref: DocumentReference, data: Record<string, unknown>) => void;
  flush: () => Promise<void>;
  size: () => number;
} {
  const localQueue: Array<{ ref: DocumentReference; data: Record<string, unknown> }> = [];
  let flushTimer: NodeJS.Timeout | null = null;

  const scheduleFlush = () => {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(async () => {
      await flush();
    }, flushInterval);
  };

  const add = (ref: DocumentReference, data: Record<string, unknown>) => {
    localQueue.push({ ref, data });
    scheduleFlush();
  };

  const flush = async () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (localQueue.length === 0) return;

    const batch = writeBatch(db);
    const ops = [...localQueue];
    localQueue.length = 0;

    for (const op of ops) {
      batch.set(op.ref, op.data);
    }

    await batch.commit();
  };

  const size = () => localQueue.length;

  return { add, flush, size };
}
