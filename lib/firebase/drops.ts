import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import { Drop } from '@/lib/utils/types';

/**
 * Save a drop to Firestore 'drops' collection
 */
export const saveDropToFirestore = async (drop: {
  lat: number;
  lng: number;
  photoUrl?: string; // Optional - marker drops don't have photos
  trackUrl?: string; // Optional - music drops
  createdBy: string;
  timestamp: Date;
  likes?: string[];
  username?: string;
  userProfilePic?: string;
}): Promise<string | null> => {
  try {
    const dropData: any = {
      lat: drop.lat,
      lng: drop.lng,
      createdBy: drop.createdBy,
      timestamp: Timestamp.fromDate(drop.timestamp),
      likes: drop.likes || [],
      username: drop.username,
      userProfilePic: drop.userProfilePic,
    };

    if (drop.photoUrl) dropData.photoUrl = drop.photoUrl;
    if (drop.trackUrl) dropData.trackUrl = drop.trackUrl;

    const docRef = await addDoc(collection(db, 'drops'), dropData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving drop to Firestore:', error);
    return null;
  }
};

/**
 * Load all drops from Firestore
 */
export const loadAllDrops = async (): Promise<Drop[]> => {
  try {
    const q = query(
      collection(db, 'drops'),
      orderBy('timestamp', 'desc'),
      limit(500)
    );

    const querySnapshot = await getDocs(q);
    const loadedDrops: Drop[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      loadedDrops.push({
        id: `drop-${doc.id}`,
        firestoreId: doc.id,
        lat: data.lat,
        lng: data.lng,
        photoUrl: data.photoUrl || undefined,
        trackUrl: data.trackUrl || undefined,
        createdBy: data.createdBy,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
        likes: data.likes || [],
        username: data.username,
        userProfilePic: data.userProfilePic,
      });
    });

    return loadedDrops;
  } catch (error) {
    console.error('Error loading drops:', error);
    return [];
  }
};

/**
 * Like a drop (add user UID to likes array)
 */
export const likeDrop = async (dropId: string, userId: string): Promise<boolean> => {
  try {
    const dropRef = doc(db, 'drops', dropId);
    const dropDoc = await getDoc(dropRef);
    
    if (!dropDoc.exists()) {
      console.error('Drop not found');
      return false;
    }

    const dropData = dropDoc.data();
    const currentLikes = dropData.likes || [];

    // Check if user already liked
    if (currentLikes.includes(userId)) {
      console.log('User already liked this drop');
      return false;
    }

    // Add user to likes array
    await updateDoc(dropRef, {
      likes: [...currentLikes, userId],
    });

    return true;
  } catch (error) {
    console.error('Error liking drop:', error);
    return false;
  }
};

/**
 * Unlike a drop (remove user UID from likes array)
 */
export const unlikeDrop = async (dropId: string, userId: string): Promise<boolean> => {
  try {
    const dropRef = doc(db, 'drops', dropId);
    const dropDoc = await getDoc(dropRef);
    
    if (!dropDoc.exists()) {
      console.error('Drop not found');
      return false;
    }

    const dropData = dropDoc.data();
    const currentLikes = dropData.likes || [];

    // Remove user from likes array
    const updatedLikes = currentLikes.filter((uid: string) => uid !== userId);

    await updateDoc(dropRef, {
      likes: updatedLikes,
    });

    return true;
  } catch (error) {
    console.error('Error unliking drop:', error);
    return false;
  }
};
