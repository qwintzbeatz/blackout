import { useState } from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '@/lib/types/blackout';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CharacterSelectionProps {
  user: User;
  userProfile: UserProfile;
  crewId: string;
  onComplete: () => void;
  onBack: () => void;
}

const CHARACTERS = [
  { id: 'street-artist', name: 'The Street Artist', description: 'Gifted with graffiti skills and keen eye for urban art', ability: 'Unlocks hidden murals faster' },
  { id: 'investigator', name: 'The Investigator', description: 'Analytical mind perfect for solving mysteries', ability: '+25% clue discovery rate' },
  { id: 'socialite', name: 'The Socialite', description: 'Charismatic networker who connects crews', ability: 'Better crew collaboration rewards' },
  { id: 'historian', name: 'The Historian', description: 'Knowledge of local lore and urban history', ability: 'Access to exclusive historical markers' },
  { id: 'tech-whiz', name: 'The Tech Whiz', description: 'Hacking skills and digital expertise', ability: 'Can access digital-only clues' },
  { id: 'athlete', name: 'The Athlete', description: 'Parkour expert and urban explorer', ability: 'Access hard-to-reach locations' },
];

export default function CharacterSelection({ user, userProfile, crewId, onComplete, onBack }: CharacterSelectionProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSelectCharacter = async () => {
    if (!selectedCharacter) {
      setError('Please select a character');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        playerCharacterId: selectedCharacter,
        lastActive: new Date(),
      });

      // Redirect to map after successful selection
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      setError('Failed to save character selection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#4dabf7' }}>
          🎭 Select Your Character
        </h2>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#cbd5e1',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
      </div>

      <p style={{ color: '#cbd5e1', marginBottom: '30px', fontSize: '16px' }}>
        Choose a character archetype that defines your role in the Blackout story. 
        Each character has unique abilities that affect gameplay and story progression.
      </p>

      {error && (
        <div style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.2)', 
          color: '#fca5a5',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {CHARACTERS.map((character) => (
          <div
            key={character.id}
            onClick={() => setSelectedCharacter(character.id)}
            style={{
              padding: '20px',
              backgroundColor: selectedCharacter === character.id 
                ? 'rgba(77, 171, 247, 0.2)' 
                : 'rgba(255,255,255,0.05)',
              border: selectedCharacter === character.id 
                ? '2px solid #4dabf7' 
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              color: selectedCharacter === character.id ? '#4dabf7' : '#e0e0e0',
              marginBottom: '10px'
            }}>
              {character.name}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#cbd5e1',
              marginBottom: '15px'
            }}>
              {character.description}
            </div>
            <div style={{
              fontSize: '12px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              padding: '8px',
              borderRadius: '6px',
              borderLeft: '3px solid #10b981'
            }}>
              <strong>Ability:</strong> {character.ability}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '15px 30px',
            background: 'rgba(255,255,255,0.1)',
            color: '#cbd5e1',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSelectCharacter}
          disabled={loading || !selectedCharacter}
          style={{
            padding: '15px 30px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: loading || !selectedCharacter ? 0.7 : 1
          }}
        >
          {loading ? 'Saving...' : 'Complete Profile →'}
        </button>
      </div>
    </div>
  );
}