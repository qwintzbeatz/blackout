import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  doc,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from './config';
import { UserMarker } from '@/lib/types/blackout';

export const saveMarkerToFirestore = async (marker: UserMarker): Promise<string | null> => {
  try {
    const markerData = {
      position: marker.position,
      name: marker.name,
      description: marker.description,
      color: marker.color,
      timestamp: Timestamp.fromDate(marker.timestamp),
      userId: marker.userId,
      username: marker.username,
      userProfilePic: marker.userProfilePic,
      createdAt: Timestamp.now(),
      distanceFromCenter: marker.distanceFromCenter || null
    };
    
    const docRef = await addDoc(collection(db, 'markers'), markerData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving marker to Firestore:', error);
    return null;
  }
};

export const loadUserMarkersFromFirestore = async (userId: string, maxMarkers: number = 100): Promise<UserMarker[]> => {
  try {
    const q = query(
      collection(db, 'markers'), 
      where('userId', '==', userId),
      limit(maxMarkers)
    );
    
    const querySnapshot = await getDocs(q);
    const loadedMarkers: UserMarker[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      loadedMarkers.push({
        id: `user-marker-${doc.id}`,
        firestoreId: doc.id,
        position: data.position,
        name: data.name,
        description: data.description,
        color: data.color || '#10b981',
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
        userId: data.userId,
        username: data.username,
        userProfilePic: data.userProfilePic,
        distanceFromCenter: data.distanceFromCenter
      });
    });
    
    // Sort by most recent first
    loadedMarkers.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return loadedMarkers;
  } catch (error) {
    console.error('Error loading markers:', error);
    return [];
  }
};

export const deleteMarkerFromFirestore = async (firestoreId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'markers', firestoreId));
  } catch (error) {
    console.error('Error deleting marker from Firestore:', error);
  }
};

export const deleteAllUserMarkersFromFirestore = async (userId: string, maxMarkers: number = 100): Promise<void> => {
  try {
    const q = query(
      collection(db, 'markers'), 
      where('userId', '==', userId),
      limit(maxMarkers)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises: Promise<void>[] = [];
    
    querySnapshot.forEach((document) => {
      deletePromises.push(deleteDoc(doc(db, 'markers', document.id)));
    });
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting all markers:', error);
  }
};