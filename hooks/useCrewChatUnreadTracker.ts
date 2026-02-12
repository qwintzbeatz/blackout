// hooks/useCrewChatUnreadTracker.ts
import { useState, useEffect } from 'react';
import { auth, realtimeDb, db } from '@/lib/firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ref, onValue, off, query, orderByChild, startAt } from 'firebase/database';
import { doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { CrewChatMessage, UserProfile } from '@/lib/types/blackout'; // Ensure CrewChatMessage is correct

export interface CrewChatUnreadStatus {
  hasUnreadMessages: boolean;
  unreadCount: number;
}

const useCrewChatUnreadTracker = () => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 1. Listen for current user
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Listen for user profile and crewId
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }

    const userProfileRef = doc(db, 'users', currentUser.uid);
    const unsubscribeProfile = onSnapshot(userProfileRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribeProfile();
  }, [currentUser]);

  // 3. Listen for crew chat messages and calculate unread status
  useEffect(() => {
    if (!userProfile?.crewId || !currentUser) {
      setHasUnreadMessages(false);
      setUnreadCount(0);
      return;
    }

    const crewId = userProfile.crewId;
    const lastReadTimestamp = userProfile.crewLastReadTimestamps?.[crewId]?.toMillis() || 0;

    const messagesRef = ref(realtimeDb, `crew-chat/${crewId}`);
    // Query for messages newer than lastReadTimestamp (or all if not available)
    const messagesQuery = query(
      messagesRef,
      orderByChild('timestamp'),
      startAt(lastReadTimestamp > 0 ? lastReadTimestamp + 1 : 0) // +1 to exclude the last read message
    );

    const unsubscribeChat = onValue(messagesQuery, (snapshot) => {
      let count = 0;
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val() as CrewChatMessage;
        // Ensure the message is from someone else, not the current user, and newer than last read
        if (message.senderUid !== currentUser.uid && message.timestamp > lastReadTimestamp) {
          count++;
        }
      });
      setUnreadCount(count);
      setHasUnreadMessages(count > 0);
    }, (error) => {
      console.error('Error listening to crew chat for unread messages:', error);
    });

    return () => {
      off(messagesQuery, 'value', unsubscribeChat);
    };
  }, [userProfile, currentUser]); // Re-run when userProfile or currentUser changes

  // Function to mark all messages in the current crew chat as read
  const markCrewChatAsRead = async () => {
    if (!currentUser || !userProfile?.crewId) return;

    try {
      const userProfileRef = doc(db, 'users', currentUser.uid);
      const crewId = userProfile.crewId;

      await updateDoc(userProfileRef, {
        [`crewLastReadTimestamps.${crewId}`]: Timestamp.now()
      });
      console.log(`Marked crew ${crewId} chat as read for user ${currentUser.uid}`);
      setHasUnreadMessages(false);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking crew chat as read:', error);
    }
  };

  return { hasUnreadMessages, unreadCount, markCrewChatAsRead };
};

export default useCrewChatUnreadTracker;
