'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useGPSTracker } from '@/hooks/useGPSTracker';
import { CREWS } from '@/data/crews';
import { UserProfile } from '@/lib/types/blackout';
import CharacterSelection from '@/components/CharacterSelection';
import { Gender } from '@/types';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';
import { initializeUnlockedColors, getDefaultColorForCrew, CrewId } from '@/utils/colorUnlocks';

interface CrewData {
  id: string;
  name: string;
  leader: string;
  description: string;
  bonus: string;
  colors: {
    primary: string;
    secondary: string;
  };
}

export default function SelectCrewPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCrew, setSelectedCrew] = useState<string>('');
  const [selectedCrewName, setSelectedCrewName] = useState<string>('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<Gender>('prefer-not-to-say');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);
  
  const { position: gpsPosition } = useGPSTracker();
  
  // Check auth state and load user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Load user profile
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const profile: UserProfile = {
              uid: data.uid || currentUser.uid,
              email: data.email || currentUser.email || '',
              username: data.username || '',
              gender: data.gender || 'prefer-not-to-say',
              profilePicUrl: data.profilePicUrl || generateAvatarUrl(currentUser.uid, data.username, data.gender, 60),
              rep: data.rep || 0,
              level: data.level || 1,
              rank: data.rank || 'TOY',
              totalMarkers: data.totalMarkers || 0,
              favoriteColor: data.favoriteColor || '#10b981',
              unlockedTracks: data.unlockedTracks || ['https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1'],
              createdAt: data.createdAt?.toDate() || new Date(),
              lastActive: data.lastActive?.toDate() || new Date(),
              crewId: data.crewId || null,
              crewName: data.crewName || null,
              isSolo: data.isSolo !== undefined ? data.isSolo : true,
              crewJoinedAt: data.crewJoinedAt?.toDate() || null,
              crewRank: data.crewRank || 'RECRUIT',
              crewRep: data.crewRep || 0,
              currentAct: data.currentAct || 1,
              storyProgress: data.storyProgress || 0,
              markersPlaced: data.markersPlaced || 0,
              photosTaken: data.photosTaken || 0,
              collaborations: data.collaborations || 0,
              blackoutEventsInvestigated: data.blackoutEventsInvestigated || 0,
              kaiTiakiEvaluationsReceived: data.kaiTiakiEvaluationsReceived || 0
            };
            
            setUserProfile(profile);
            setUsername(profile.username);
            setGender(profile.gender);
            setProfilePicUrl(profile.profilePicUrl);
            
            if (profile.crewId) {
              setSelectedCrew(profile.crewId);
              setSelectedCrewName(profile.crewName || '');
            }
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          setError('Failed to load profile');
        }
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Update avatar preview when username, gender, or selected crew changes
  useEffect(() => {
    if (user && username) {
      setProfilePicUrl(generateAvatarUrl(user.uid, username, gender, 100, undefined, selectedCrew || null));
    }
  }, [username, gender, user, selectedCrew]);
  
  const handleSelectCrew = (crew: CrewData) => {
    setSelectedCrew(crew.id);
    setSelectedCrewName(crew.name);
    setError(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be signed in');
      return;
    }
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    if (!selectedCrew) {
      setError('Please select a crew');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const selectedCrewData = CREWS.find(c => c.id === selectedCrew);
      if (!selectedCrewData) {
        throw new Error('Invalid crew selection');
      }
      
      // Generate profile picture with crew color
      const finalProfilePicUrl = generateAvatarUrl(user.uid, username.trim(), gender, 100, undefined, selectedCrew);
      
      // Initialize unlocked colors based on crew selection
      const unlockedColors = initializeUnlockedColors(selectedCrew as CrewId);
      const selectedColor = getDefaultColorForCrew(selectedCrew as CrewId);
      
      // Prepare user profile data
      const userProfileData = {
        uid: user.uid,
        email: user.email || '',
        username: username.trim(),
        gender: gender,
        profilePicUrl: finalProfilePicUrl,
        rep: userProfile?.rep || 0,
        level: userProfile?.level || 1,
        rank: userProfile?.rank || 'TOY',
        totalMarkers: userProfile?.totalMarkers || 0,
        favoriteColor: selectedColor, // Use crew color as default
        unlockedTracks: userProfile?.unlockedTracks || ['https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1'],
        createdAt: userProfile?.createdAt || Timestamp.now(),
        lastActive: Timestamp.now(),
        crewId: selectedCrew,
        crewName: selectedCrewData.name,
        isSolo: false, // User is joining a crew, so not solo
        crewJoinedAt: Timestamp.now(),
        crewRank: 'RECRUIT',
        crewRep: 0,
        currentAct: userProfile?.currentAct || 1,
        storyProgress: userProfile?.storyProgress || 0,
        markersPlaced: userProfile?.markersPlaced || 0,
        photosTaken: userProfile?.photosTaken || 0,
        collaborations: userProfile?.collaborations || 0,
        blackoutEventsInvestigated: userProfile?.blackoutEventsInvestigated || 0,
        kaiTiakiEvaluationsReceived: userProfile?.kaiTiakiEvaluationsReceived || 0,
        playerCharacterId: userProfile?.playerCharacterId || null, // Will be set by character selection
        unlockedColors: unlockedColors,
        selectedColor: selectedColor
      };
      
      // Update or create user profile
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, userProfileData, { merge: true });
      
      // Handle crew membership
      const crewsRef = collection(db, 'crews');
      const crewQuery = query(crewsRef, where('id', '==', selectedCrew));
      const crewSnapshot = await getDocs(crewQuery);
      
      if (crewSnapshot.empty) {
        // Create new crew if it doesn't exist
        const newCrewRef = doc(crewsRef);
        await setDoc(newCrewRef, {
          id: selectedCrew,
          name: selectedCrewData.name,
          members: [user.uid],
          createdAt: Timestamp.now(),
          createdBy: user.uid,
          rep: 0,
          color: selectedCrewData.color,
          description: selectedCrewData.description,
          bonus: selectedCrewData.bonus
        });
      } else {
        // Add user to existing crew
        const crewDoc = crewSnapshot.docs[0];
        const currentMembers = crewDoc.data().members || [];
        if (!currentMembers.includes(user.uid)) {
          await updateDoc(doc(db, 'crews', crewDoc.id), {
            members: [...currentMembers, user.uid]
          });
        }
      }
      
      // Initialize story progress if not already
      const storyRef = doc(db, 'story', user.uid);
      const storyDoc = await getDoc(storyRef);
      
      if (!storyDoc.exists()) {
        await setDoc(storyRef, {
          userId: user.uid,
          currentAct: 1,
          storyProgress: 0,
          completedMissions: [],
          activeMissions: ['act1_intro'],
          crewTrust: { bqc: 0, sps: 0, lzt: 0, dgc: 0 },
          plotRevealed: false,
          lastUpdated: Timestamp.now()
        });
      }
      
      setSuccess(`Successfully joined ${selectedCrewData.name}!`);
      
      // Show character selection instead of redirecting
      setShowCharacterSelection(true);
      
    } catch (error: any) {
      console.error('Error updating crew:', error);
      setError(`Failed to join crew: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleGoSolo = async () => {
    if (!user) {
      setError('You must be signed in');
      return;
    }
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Generate profile picture for solo player (amber background)
      const finalProfilePicUrl = generateAvatarUrl(user.uid, username.trim(), gender, 100, undefined, null);
      
      // Solo players get grey only
      const soloUnlockedColors = initializeUnlockedColors(null); // null = solo
      const soloSelectedColor = getDefaultColorForCrew(null); // Grey
      
      const userProfileData = {
        uid: user.uid,
        email: user.email || '',
        username: username.trim(),
        gender: gender,
        profilePicUrl: finalProfilePicUrl,
        rep: userProfile?.rep || 0,
        level: userProfile?.level || 1,
        rank: userProfile?.rank || 'TOY',
        totalMarkers: userProfile?.totalMarkers || 0,
        favoriteColor: soloSelectedColor, // Grey for solo
        unlockedTracks: userProfile?.unlockedTracks || ['https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1'],
        lastActive: Timestamp.now(),
        crewId: null,
        crewName: null,
        isSolo: true,
        crewJoinedAt: null,
        unlockedColors: soloUnlockedColors,
        selectedColor: soloSelectedColor
      };
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, userProfileData, { merge: true });
      
      setSuccess('Going solo! You can join a crew anytime from your profile.');
      
      // Redirect to map after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error going solo:', error);
      setError(`Failed to update profile: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleLeaveCrew = async () => {
    if (!user || !userProfile?.crewId) return;
    
    if (!confirm(`Are you sure you want to leave ${userProfile.crewName}?`)) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Remove user from crew members list
      const crewDoc = await getDoc(doc(db, 'crews', userProfile.crewId));
      if (crewDoc.exists()) {
        const currentMembers = crewDoc.data().members || [];
        const updatedMembers = currentMembers.filter((uid: string) => uid !== user.uid);
        
        await updateDoc(doc(db, 'crews', userProfile.crewId), {
          members: updatedMembers
        });
      }
      
      // Update user profile
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        crewId: null,
        crewName: null,
        isSolo: true,
        crewJoinedAt: null,
        lastActive: Timestamp.now()
      });
      
      setUserProfile(prev => prev ? {
        ...prev,
        crewId: null,
        crewName: null,
        isSolo: true,
        crewJoinedAt: null
      } : null);
      
      setSelectedCrew('');
      setSelectedCrewName('');
      setSuccess(`Successfully left ${userProfile.crewName}. You are now solo.`);
      
    } catch (error: any) {
      console.error('Error leaving crew:', error);
      setError(`Failed to leave crew: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #4dabf7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ fontSize: '18px', color: '#cbd5e1' }}>
          Loading...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '24px', color: '#cbd5e1', fontWeight: 'bold' }}>
          Please sign in first
        </div>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'linear-gradient(135deg, #4dabf7, #3b82f6)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Go to Sign In
        </button>
      </div>
    );
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#0f172a',
      backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(78, 205, 196, 0.1) 0%, transparent 20%)',
      color: '#e0e0e0',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px'
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#cbd5e1',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          ← Back to Map
        </button>
      </div>
      
      <div style={{
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        padding: '40px',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(20px)'
      }}>
        {/* Current Crew Status */}
        {userProfile?.crewName && !userProfile.isSolo && (
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: `rgba(${CREWS.find(c => c.id === userProfile.crewId)?.colors?.primary?.replace('#', '') || '59,130,246'}, 0.1)`,
            borderRadius: '12px',
            border: `2px solid ${CREWS.find(c => c.id === userProfile.crewId)?.colors?.primary || '#3b82f6'}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '10px',
              color: CREWS.find(c => c.id === userProfile.crewId)?.colors?.primary || '#3b82f6'
            }}>
              👥 Current Crew: {userProfile.crewName}
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '15px' }}>
              You're currently a member of {userProfile.crewName}. Select a new crew below to switch.
            </div>
            <button
              onClick={handleLeaveCrew}
              disabled={submitting}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: submitting ? 0.7 : 1
              }}
            >
              Leave Crew
            </button>
          </div>
        )}
        
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          marginBottom: '10px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4, #4dabf7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          SELECT YOUR STORY CREW
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#cbd5e1',
          textAlign: 'center',
          marginBottom: '30px',
          maxWidth: '600px',
          margin: '0 auto 30px'
        }}>
          Choose a crew to join the Blackout story. Each crew has unique missions, bonuses, and plotlines.
          You can change crews anytime, but you'll lose crew-specific progress.
        </p>
        
        {/* Error/Success Messages */}
        {error && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}
        
        {success && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#86efac',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            ✅ {success}
          </div>
        )}
        
        {/* Profile Section */}
        <div style={{
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', color: '#4dabf7' }}>
            👤 Your Profile
          </h2>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <img
                src={profilePicUrl}
                alt="Profile Preview"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  border: '3px solid #4dabf7',
                  objectFit: 'cover'
                }}
              />
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Avatar preview
              </div>
            </div>
            
            {/* Profile Form */}
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#cbd5e1' }}>
                  Username *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your graffiti tag"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', color: '#cbd5e1' }}>
                  Gender
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {(['male', 'female', 'other', 'prefer-not-to-say'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setGender(option)}
                      style={{
                        padding: '8px 16px',
                        background: gender === option ? 'rgba(77, 171, 247, 0.3)' : 'rgba(255,255,255,0.05)',
                        border: gender === option ? '1px solid #4dabf7' : '1px solid rgba(255,255,255,0.2)',
                        color: gender === option ? '#4dabf7' : '#cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      {option === 'prefer-not-to-say' ? 'Prefer not to say' : 
                       option === 'male' ? '👨 Male' :
                       option === 'female' ? '👩 Female' : 'Other'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Crew Selection */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', color: '#10b981' }}>
            👥 Choose Your Crew
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {CREWS.map((crew) => (
              <div
                key={crew.id}
                onClick={() => handleSelectCrew(crew)}
                style={{
                  padding: '20px',
                  backgroundColor: selectedCrew === crew.id ? 
                    `rgba(${parseInt(crew.color.slice(1, 3), 16)}, ${parseInt(crew.color.slice(3, 5), 16)}, ${parseInt(crew.color.slice(5, 7), 16)}, 0.2)` : 
                    'rgba(255,255,255,0.05)',
                  border: selectedCrew === crew.id ? 
                    `2px solid ${crew.color}` : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: selectedCrew === crew.id ? 'translateY(-2px)' : 'none',
                  boxShadow: selectedCrew === crew.id ? `0 8px 25px rgba(${parseInt(crew.color.slice(1, 3), 16)}, ${parseInt(crew.color.slice(3, 5), 16)}, ${parseInt(crew.color.slice(5, 7), 16)}, 0.3)` : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: crew.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: crew.accentColor,
                    fontWeight: 'bold',
                    fontSize: '24px'
                  }}>
                    {crew.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold',
                      color: crew.color
                    }}>
                      {crew.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
                      Led by: {crew.leader}
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: '14px', color: '#e0e0e0', marginBottom: '15px' }}>
                  {crew.description}
                </div>
                
                <div style={{
                  padding: '10px',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  borderLeft: `3px solid ${crew.color}`
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: crew.color, marginBottom: '5px' }}>
                    🎯 Crew Bonus:
                  </div>
                  <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                    {crew.bonus}
                  </div>
                </div>
                
                {selectedCrew === crew.id && (
                  <div style={{
                    marginTop: '15px',
                    padding: '8px',
                    background: `linear-gradient(135deg, ${crew.color}, ${crew.accentColor})`,
                    color: 'white',
                    textAlign: 'center',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    animation: 'pulse 2s infinite'
                  }}>
                    ✓ SELECTED
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {selectedCrew && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#86efac'
            }}>
              <strong>ℹ️ Important:</strong> Your crew choice affects story progression, missions, and bonuses. 
              You can change crews later from your profile, but you'll lose crew-specific progress.
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: '30px'
        }}>
          <button
            onClick={handleGoSolo}
            disabled={submitting || !username.trim()}
            style={{
              padding: '15px 30px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: (submitting || !username.trim()) ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: (submitting || !username.trim()) ? 0.7 : 1,
              transition: 'all 0.3s ease',
              minWidth: '200px'
            }}
            onMouseOver={(e) => {
              if (!submitting && username.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🎯 Go Solo
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedCrew || !username.trim()}
            style={{
              padding: '15px 30px',
              background: selectedCrew ? 
                `linear-gradient(135deg, ${CREWS.find(c => c.id === selectedCrew)?.color || '#4dabf7'}, ${CREWS.find(c => c.id === selectedCrew)?.accentColor || '#3b82f6'})` : 
                'linear-gradient(135deg, #6b7280, #4b5563)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: (submitting || !selectedCrew || !username.trim()) ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: (submitting || !selectedCrew || !username.trim()) ? 0.7 : 1,
              transition: 'all 0.3s ease',
              minWidth: '200px'
            }}
            onMouseOver={(e) => {
              if (!submitting && selectedCrew && username.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 25px rgba(${parseInt(CREWS.find(c => c.id === selectedCrew)?.color?.slice(1, 3) || '77')}, ${parseInt(CREWS.find(c => c.id === selectedCrew)?.color?.slice(3, 5) || '171')}, ${parseInt(CREWS.find(c => c.id === selectedCrew)?.color?.slice(5, 7) || '247')}, 0.3)`;
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {submitting ? 'Processing...' : selectedCrew ? `Join ${selectedCrewName}! 👥` : 'Select a Crew'}
          </button>
        </div>
        
        {/* Stats Display */}
        {userProfile && (
          <div style={{
            marginTop: '30px',
            padding: '15px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b' }}>
                {userProfile.rep}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>REP</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4dabf7' }}>
                {userProfile.level}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>LEVEL</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                {userProfile.totalMarkers}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>MARKERS</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                {userProfile.rank}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>RANK</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Character Selection Modal */}
      {showCharacterSelection && user && userProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '20px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
            <CharacterSelection 
              user={user}
              userProfile={userProfile}
              crewId={selectedCrew}
              onComplete={() => {
                // Handle character selection completion and redirect to map
                router.push('/');
              }}
              onBack={() => {
                setShowCharacterSelection(false);
                setSuccess(null);
              }}
            />
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
