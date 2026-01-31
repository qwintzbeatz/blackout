// lib/types/playerCharacters.ts

import { CrewId } from './story';

export interface PlayerCharacter {
  id: string;
  name: string;
  nickname?: string;
  bio: string;
  age: number;
  background: string;
  motivations: string[];
  personalityTraits: string[];
  specialAbilities: string[];
  weaknesses: string[];
  storyArc: string;
  dialogStyle: string;
  
  // Visual characteristics
  appearance: {
    gender: 'male' | 'female' | 'non-binary';
    height: string;
    build: string;
    hairStyle: string;
    clothingStyle: string;
    accessories: string[];
  };
  
  // Crew assignment
  defaultCrew: CrewId; // bqc, sps, lzt, dgc
  crewRoles: string[];
  loyaltyScore: number; // 0-100 for how loyal to their crew
  trustIssues: string[]; // Triggers for betrayal
  
  // Gameplay stats
  stats: {
    artisticSkill: number; // 1-10
    technicalSkill: number; // 1-10
    socialSkill: number; // 1-10
    stealthSkill: number; // 1-10
    leadershipSkill: number; // 1-10
  };
  
  // Character development
  characterGrowth: {
    startingBeliefs: string[];
    finalBeliefs: string[];
    keyDecisions: string[];
    plotImpact: string[];
  };
  
  // Relationships with other characters
  relationships: {
    [crewId in CrewId]: {
      startingOpinion: number; // -10 to 10
      maxOpinion: number;
      minOpinion: number;
      dialogueKeys: string[];
    };
  };
}

// Player characters for BLAQWT crew
export const BLAQWT_PLAYERS: PlayerCharacter[] = [
  {
    id: 'bqc_tech',
    name: 'Kai',
    nickname: 'Cipher',
    bio: 'A brilliant tech prodigy who accidentally stumbled upon the truth behind The Blackout',
    age: 24,
    background: 'Computer science graduate turned street artist. Discovered MASTAMIND\'s logs while doing security work.',
    motivations: ['Expose corporate manipulation', 'Protect authentic street art', 'Find redemption'],
    personalityTraits: ['Analytical', 'Observant', 'Moral Compass', 'Tech-Savvy'],
    specialAbilities: ['Hacking Systems', 'Data Analysis', 'Digital Forensics'],
    weaknesses: ['Trust Issues', 'Overthinking', 'Fear of Betrayal'],
    storyArc: 'From naive bystander to key whistleblower exposing BLAQWT\'s true intentions',
    dialogStyle: 'Technical, thoughtful, cautious',
    appearance: {
      gender: 'non-binary',
      height: '5\'8"',
      build: 'Lean',
      hairStyle: 'Tech-cut with LED highlights',
      clothingStyle: 'Urban techwear with augmented reality glasses',
      accessories: ['Smartwatch', 'Encrypted phone', 'LED backpack']
    },
    defaultCrew: 'bqc',
    crewRoles: ['Tech Analyst', 'Whistleblower', 'Digital Artist'],
    loyaltyScore: 40, // Low - knows something's wrong
    trustIssues: ['Corporate lies', 'Hidden agendas', 'Technology abuse'],
    stats: {
      artisticSkill: 7,
      technicalSkill: 9,
      socialSkill: 5,
      stealthSkill: 6,
      leadershipSkill: 6
    },
    characterGrowth: {
      startingBeliefs: ['Technology can save the world', 'Systems are trustworthy'],
      finalBeliefs: ['Human emotion beats AI perfection', 'Communities know best'],
      keyDecisions: ['Expose BLAQWT publicly', 'Join the resistance alliance'],
      plotImpact: ['Reveals Kai Tiaki\'s origins', 'Gives SPONTANEOUS key frequency data']
    },
    relationships: {
      bqc: { startingOpinion: 2, maxOpinion: 5, minOpinion: -10, dialogueKeys: ['suspicious', 'investigative'] },
      sps: { startingOpinion: -1, maxOpinion: 8, minOpinion: -3, dialogueKeys: ['intrigued', 'collaborative'] },
      lzt: { startingOpinion: 3, maxOpinion: 9, minOpinion: -1, dialogueKeys: ['respectful', 'empathetic'] },
      dgc: { startingOpinion: 0, maxOpinion: 7, minOpinion: -2, dialogueKeys: ['cautious', 'learning'] }
    }
  },
  {
    id: 'bqc_mole',
    name: 'Jax',
    nickname: 'Spectre',
    bio: 'Undercover agent placed in BLAQWT by the street art preservation society',
    age: 29,
    background: 'Former art curator turned preservation activist. Infiltrated BLAQWT after noticing patterns.',
    motivations: ['Protect cultural heritage', 'Document disappearing art', 'Rebuild authentic communities'],
    personalityTraits: ['Cunning', 'Patient', 'Observant', 'Strategic'],
    specialAbilities: ['Art Authentication', 'Corporate Infiltration', 'Community Organization'],
    weaknesses: ['Risk of Discovery', 'Emotional Attachment', 'Moral Conflicts'],
    storyArc: 'Deep undercover agent risking everything to preserve street art history',
    dialogStyle: 'Subtle, coded language, double meanings',
    appearance: {
      gender: 'male',
      height: '6\'0"',
      build: 'Athletic',
      hairStyle: 'Professional undercut',
      clothingStyle: 'Business casual with streetwear elements',
      accessories: ['Antique watch', 'Hidden camera pen', 'Art preservation tools']
    },
    defaultCrew: 'bqc',
    crewRoles: ['Infiltration Specialist', 'Historian', 'Double Agent'],
    loyaltyScore: 10, // Very low - working against BLAQWT
    trustIssues: ['Corporate agendas', 'Cultural erasure', 'Hidden motives'],
    stats: {
      artisticSkill: 8,
      technicalSkill: 6,
      socialSkill: 9,
      stealthSkill: 8,
      leadershipSkill: 7
    },
    characterGrowth: {
      startingBeliefs: ['Systems can be reformed from within', 'Evidence changes minds'],
      finalBeliefs: ['Direct action saves cultures', 'Communities protect themselves'],
      keyDecisions: ['Leak BLAQWT documents', 'Join DGC preservation efforts'],
      plotImpact: ['Provides key evidence against BLAQWT', 'Connects crews to historical resources']
    },
    relationships: {
      bqc: { startingOpinion: -8, maxOpinion: -2, minOpinion: -10, dialogueKeys: ['mock-respectful', 'strategic'] },
      sps: { startingOpinion: 4, maxOpinion: 6, minOpinion: 2, dialogueKeys: ['intrigued', 'allied'] },
      lzt: { startingOpinion: 7, maxOpinion: 10, minOpinion: 5, dialogueKeys: ['respectful', 'protective'] },
      dgc: { startingOpinion: 9, maxOpinion: 10, minOpinion: 8, dialogueKeys: ['reverent', 'historic'] }
    }
  }
];

// Player characters for SPONTANEOUS crew
export const SPONTANEOUS_PLAYERS: PlayerCharacter[] = [
  {
    id: 'sps_alien',
    name: 'Nova',
    nickname: 'Spectra',
    bio: 'Human-alien hybrid who can perceive The Blackout frequency patterns',
    age: 22,
    background: 'Grew up near unusual energy sources. Developed sensitivity to light and sound frequencies.',
    motivations: ['Understand The Blackout', 'Help Gregory build portal', 'Find cosmic balance'],
    personalityTraits: ['Intuitive', 'Creative', 'Eccentric', 'Empathic'],
    specialAbilities: ['Frequency Detection', 'Light Manipulation', 'Alien Communication'],
    weaknesses: ['Overwhelmed by stimuli', 'Strange behavior', 'Difficulty with humans'],
    storyArc: 'Embrace alien heritage to save both human and alien art',
    dialogStyle: 'Poetic, abstract, frequency-based metaphors',
    appearance: {
      gender: 'female',
      height: '5\'7"',
      build: 'Graceful',
      hairStyle: 'Neon-dyed dreadlocks',
      clothingStyle: 'Glow-in-dark fabrics with crystal accessories',
      accessories: ['Frequency amplifier', 'Crystal pendant', 'Glowing tattoos']
    },
    defaultCrew: 'sps',
    crewRoles: ['Frequency Specialist', 'Portal Builder', 'Alien Liaison'],
    loyaltyScore: 85, // High - understands the cosmic mission
    trustIssues: ['Limited human understanding', 'Corporate frequency suppression'],
    stats: {
      artisticSkill: 9,
      technicalSkill: 4,
      socialSkill: 3,
      stealthSkill: 7,
      leadershipSkill: 5
    },
    characterGrowth: {
      startingBeliefs: ['Aliens should leave Earth', 'Humanity isn\'t ready'],
      finalBeliefs: ['Human-alien collaboration creates magic', 'Art transcends species'],
      keyDecisions: ['Share frequency knowledge', 'Bridge human-alien understanding'],
      plotImpact: ['Helps decode Kai Tiaki frequency', 'Creates bridge between worlds']
    },
    relationships: {
      bqc: { startingOpinion: -5, maxOpinion: -8, minOpinion: -10, dialogueKeys: ['wary', 'fascinated'] },
      sps: { startingOpinion: 8, maxOpinion: 10, minOpinion: 6, dialogueKeys: ['connected', 'harmonious'] },
      lzt: { startingOpinion: 6, maxOpinion: 9, minOpinion: 4, dialogueKeys: ['curious', 'healing'] },
      dgc: { startingOpinion: 4, maxOpinion: 7, minOpinion: 2, dialogueKeys: ['respectful', 'learning'] }
    }
  }
];

// Player characters for LUZUNT crew
export const LUZUNT_PLAYERS: PlayerCharacter[] = [
  {
    id: 'lzt_therapist',
    name: 'Maya',
    nickname: 'Serenity',
    bio: 'Art therapist using street art to help community healing after The Blackout',
    age: 27,
    background: 'Psychology graduate who saw street art as therapeutic. Sister of RASH.',
    motivations: ['Heal community trauma', 'Use art for mental health', 'Build emotional resilience'],
    personalityTraits: ['Empathic', 'Patient', 'Supportive', 'Insightful'],
    specialAbilities: ['Emotional First Aid', 'Community Healing', 'Art Therapy Techniques'],
    weaknesses: ['Takes on others pain', 'Overly trusting', 'Emotional exhaustion'],
    storyArc: 'Guide community through emotional trauma of losing their art',
    dialogStyle: 'Comforting, therapeutic, metaphor-rich',
    appearance: {
      gender: 'female',
      height: '5\'6"',
      build: 'Comforting',
      hairStyle: 'Gentle curls with healing crystals',
      clothingStyle: 'Soft fabrics in healing colors',
      accessories: ['Healing crystal necklace', 'Art therapy journal', 'Community support cards']
    },
    defaultCrew: 'lzt',
    crewRoles: ['Therapist', 'Community Organizer', 'Emotional Support'],
    loyaltyScore: 90, // High - deeply connected to healing mission
    trustIssues: ['Emotional manipulation', 'False healing promises', 'Superficial solutions'],
    stats: {
      artisticSkill: 6,
      technicalSkill: 4,
      socialSkill: 9,
      stealthSkill: 5,
      leadershipSkill: 8
    },
    characterGrowth: {
      startingBeliefs: ['Art heals gently', 'Systems will protect communities'],
      finalBeliefs: ['Radical empathy saves worlds', 'Action heals faster than words'],
      keyDecisions: ['Organize healing murals', 'Confront corporate emotional manipulation'],
      plotImpact: ['Creates community safe spaces', 'Heals divided crews']
    },
    relationships: {
      bqc: { startingOpinion: -7, maxOpinion: -3, minOpinion: -10, dialogueKeys: ['concerned', 'professional'] },
      sps: { startingOpinion: 5, maxOpinion: 8, minOpinion: 3, dialogueKeys: ['curious', 'supportive'] },
      lzt: { startingOpinion: 9, maxOpinion: 10, minOpinion: 8, dialogueKeys: ['family', 'therapeutic'] },
      dgc: { startingOpinion: 7, maxOpinion: 9, minOpinion: 5, dialogueKeys: ['respectful', 'protective'] }
    }
  }
];

// Player characters for DON'T GET CAPPED crew
export const DONTCAPPED_PLAYERS: PlayerCharacter[] = [
  {
    id: 'dgc_historian',
    name: 'Leo',
    nickname: 'Chronicler',
    bio: 'Graffiti historian preserving street art history before The Blackout erases everything',
    age: 32,
    background: 'Art history professor specializing in street art. Studied under RATMAN.',
    motivations: ['Preserve cultural history', 'Document disappearing art', 'Teach next generation'],
    personalityTraits: ['Wise', 'Traditional', 'Respectful', 'Meticulous'],
    specialAbilities: ['Art History Knowledge', 'Documentation Skills', 'Historical Preservation'],
    weaknesses: ['Reluctance to change', 'Overly protective', 'Difficulty with digital'],
    storyArc: 'Bridge gap between traditional street art and digital preservation',
    dialogStyle: 'Educational, historical references, narrative',
    appearance: {
      gender: 'male',
      height: '5\'10"',
      build: 'Scholar\'s build',
      hairStyle: 'Classic academic with graying temples',
      clothingStyle: 'Vintage streetwear mixed with academic wear',
      accessories: ['Antique camera', 'History books', 'Restoration tools']
    },
    defaultCrew: 'dgc',
    crewRoles: ['Historian', 'Archivist', 'Teacher'],
    loyaltyScore: 95, // Very high - devoted to preservation
    trustIssues: ['Digital alteration', 'Commercial exploitation', 'Cultural appropriation'],
    stats: {
      artisticSkill: 8,
      technicalSkill: 3,
      socialSkill: 7,
      stealthSkill: 6,
      leadershipSkill: 8
    },
    characterGrowth: {
      startingBeliefs: ['Preservation means no change', 'Digital destroys authenticity'],
      finalBeliefs: ['Digital can preserve physical', 'Evolution keeps traditions alive'],
      keyDecisions: ['Create digital archive', 'Teach crews preservation techniques'],
      plotImpact: ['Creates Kai Tiaki alternative archive', 'Bridges old and new preservation']
    },
    relationships: {
      bqc: { startingOpinion: -9, maxOpinion: -5, minOpinion: -10, dialogueKeys: ['distrustful', 'academic'] },
      sps: { startingOpinion: 2, maxOpinion: 5, minOpinion: -1, dialogueKeys: ['curious', 'respectful'] },
      lzt: { startingOpinion: 6, maxOpinion: 8, minOpinion: 4, dialogueKeys: ['appreciative', 'protective'] },
      dgc: { startingOpinion: 9, maxOpinion: 10, minOpinion: 8, dialogueKeys: ['devoted', 'traditional'] }
    }
  }
];

// All player characters combined
export const ALL_PLAYER_CHARACTERS: PlayerCharacter[] = [
  ...BLAQWT_PLAYERS,
  ...SPONTANEOUS_PLAYERS,
  ...LUZUNT_PLAYERS,
  ...DONTCAPPED_PLAYERS
];

export const getPlayerCharactersByCrew = (crewId: CrewId): PlayerCharacter[] => {
  switch (crewId) {
    case 'bqc': return BLAQWT_PLAYERS;
    case 'sps': return SPONTANEOUS_PLAYERS;
    case 'lzt': return LUZUNT_PLAYERS;
    case 'dgc': return DONTCAPPED_PLAYERS;
    default: return [];
  }
};

export const getPlayerCharacterById = (id: string): PlayerCharacter | undefined => {
  return ALL_PLAYER_CHARACTERS.find(char => char.id === id);
};