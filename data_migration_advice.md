
## Data Migration for Existing Drops (Geohash Backfill)

Your `saveDropToFirestore` function now correctly adds a `geohash` field to new drops, which is essential for the optimized geoqueries in `loadDropsInRadius`. However, any drops created *before* this change will not have a `geohash` field. For these older drops to be discoverable and filterable by location using the new system, you'll need to run a one-time migration.

### Why is this necessary?
The new `loadDropsInRadius` function relies on querying the `geohash` field to efficiently find drops within a geographical area. Drops without this field will simply be excluded from these optimized queries.

### Migration Approach
The safest and most common way to handle this is to run a server-side (or Node.js script) migration using the Firebase Admin SDK. This allows you to iterate through your existing 'drops' collection, calculate the `geohash` for each old drop, and update its document.

#### Conceptual Migration Script (Node.js with Firebase Admin SDK)

You would run this script outside of your main application, typically as a one-off utility.

1.  **Setup:**
    *   Create a new Node.js project or a script within your existing Firebase project's functions.
    *   Install necessary packages: `firebase-admin` and `geofire-common`.
    ```bash
    npm install firebase-admin geofire-common
    ```
    *   Initialize the Firebase Admin SDK with your service account credentials. Make sure these credentials are secure and *never* exposed client-side.

2.  **Script Logic:**
    ```javascript
    // migrateDrops.js
    const admin = require('firebase-admin');
    const { geohashForLocation } = require('geofire-common');

    // IMPORTANT: Replace with your service account key file path
    const serviceAccount = require('./path/to/your/serviceAccountKey.json'); 

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();

    async function migrateDrops() {
      console.log('Starting drops migration...');

      const dropsRef = db.collection('drops');
      // Query for drops that do NOT have a 'geohash' field
      // This is generally the safest way to find documents missing a field
      const snapshot = await dropsRef.where('geohash', '==', null).get();

      if (snapshot.empty) {
        console.log('No drops found requiring geohash migration.');
        return;
      }

      const batch = db.batch();
      let migratedCount = 0;

      console.log(`Found ${snapshot.size} drops without geohash. Processing...`);

      snapshot.forEach(doc => {
        const dropData = doc.data();
        const { lat, lng } = dropData;

        // Ensure lat and lng exist before calculating geohash
        if (typeof lat === 'number' && typeof lng === 'number') {
          const geohash = geohashForLocation([lat, lng]);
          batch.update(doc.ref, { geohash: geohash });
          migratedCount++;
        } else {
          console.warn(`Drop ${doc.id} is missing lat/lng or they are invalid. Skipping.`);
        }
      });

      if (migratedCount > 0) {
        await batch.commit();
        console.log(`Successfully migrated ${migratedCount} drops.`);
      } else {
        console.log('No valid drops found to migrate.');
      }
      console.log('Drops migration finished.');
    }

    migrateDrops().catch(console.error);
    ```

#### Important Considerations:

*   **Backup Your Data:** **ALWAYS** create a full backup of your Firestore data before running any migration script.
*   **Test Thoroughly:** Run this script on a **development/staging database first**, not directly on your production data.
*   **Service Account Security:** The `serviceAccountKey.json` grants administrative privileges. Keep it secure and outside of public repositories.
*   **Rate Limits:** For very large collections, you might need to implement pagination and/or delays in your script to avoid hitting Firestore write rate limits. The current script uses `where('geohash', '==', null)` which is generally efficient for finding missing fields, but if you have millions of documents, consider more advanced batching or Cloud Functions for larger migrations.

Once this script has been run successfully, all your existing drops will have the necessary `geohash` field and will be queryable by your optimized map loading logic.

I will now update the task list.