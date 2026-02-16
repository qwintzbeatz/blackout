## Recommendation: Optimize `useMarkers` for Geographic Relevance

We've successfully optimized data loading for `drops` by implementing geoqueries, ensuring that only geographically relevant data is fetched. It's important to apply the same optimization principles to other location-based data, particularly your `markers`.

Currently, your `loadAllMarkers` function likely fetches a broad set of markers, potentially including many that are not relevant to the user's current geographical location. As your game scales and more markers are created, this can lead to:

*   **Excessive Firestore Reads:** Consuming your daily quota unnecessarily.
*   **Slower Load Times:** Fetching and processing large amounts of irrelevant data.
*   **Increased Client-Side Processing:** The client has to filter out irrelevant markers, wasting resources.

### Proposed Optimization for `useMarkers`

The solution is to refactor how `markers` are loaded, mirroring the approach taken with `drops`:

1.  **Add `geohash` to Marker Documents:**
    *   Ensure that every `marker` document in your Firestore collection includes a `geohash` field, derived from its `position` (latitude and longitude).
    *   This can be done by modifying the function responsible for creating new markers (e.g., `saveMarkerToFirestore`) to include the `geohash` at the time of creation.
    *   **Migration for Existing Markers:** Just like with drops, you'll need a one-time migration script to backfill the `geohash` field for any existing markers that were created before this change.

2.  **Implement `loadMarkersInRadius` Function:**
    *   Create a new function (or modify `loadAllMarkers`) that accepts a central `gpsPosition` and a `radius`.
    *   This function would use `geofire-common` to calculate the appropriate `geohash` query bounds based on the `gpsPosition` and `radius`.
    *   The Firestore query would then use these `geohash` bounds to fetch only markers within the specified geographical area.
    *   Example:
        ```typescript
        import { collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
        import { geohashForLocation, geohashQueryBounds } from 'geofire-common';
        import { db } from '@/lib/firebase/config'; // Adjust path as needed

        const loadMarkersInRadius = async (center: [number, number], radiusInM: number) => {
          const bounds = geohashQueryBounds(center, radiusInM);
          const queries = [];

          for (const b of bounds) {
            const q = query(
              collection(db, 'markers'),
              orderBy('geohash'),
              startAt(b[0]),
              endAt(b[1])
            );
            queries.push(getDocs(q));
          }

          // Execute all queries in parallel
          const snapshots = await Promise.all(queries);
          const matchingMarkers: any[] = []; // Replace 'any' with your Marker interface

          for (const snap of snapshots) {
            for (const doc of snap.docs) {
              const data = doc.data();
              // Filter out markers that are outside the exact radius if needed,
              // as geohash queries can return a square bounding box.
              // (You already have a calculateDistance function for this)
              matchingMarkers.push(data);
            }
          }
          return matchingMarkers;
        };
        ```

3.  **Create a Firebase Composite Index for `markers`:**
    *   For efficient geoqueries, you will need a composite index on your `markers` collection.
    *   **Collection:** `markers`
    *   **Fields (in order):**
        1.  `geohash` (Ascending)
        2.  `createdAt` (Descending - or another relevant timestamp for ordering)
    *   Firestore will usually provide a direct link to create this index if you run a query that requires it and it's missing.

By implementing this, you will significantly reduce the number of irrelevant Firestore reads for markers, improving the game's performance, scalability, and adherence to Firebase quota limits.

I will now update the task list.