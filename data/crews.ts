import { CrewId } from '@/constants/markers';

export interface Crew {
  id: CrewId;
  name: string;
  fullName?: string;
  description: string;
  tagline?: string;
  location: string;
  leader: string;
  leaderTitle?: string;
  members: CrewMember[];
  colors: {
    primary: string;
    secondary: string;
  };
  style: string;
  strength: string;
  personality: string;
  roleInStory: string;
  motivation: string;
  frontDescription?: string;
  reality?: string;
  plotTwist?: string;
  sideQuestCharacter?: SideQuestCharacter;
  bonus: string;
}

export interface CrewMember {
  name: string;
  alias?: string;
  description: string;
  role?: string;
  background?: string;
}

export interface SideQuestCharacter {
  name: string;
  description: string;
  howToUnlock: string;
  roleIfJoined: string;
}

export const CREWS: Crew[] = [
  {
    id: 'bqc',
    name: 'BLAQWT CREW',
    fullName: 'Blaqwt Crew',
    description: 'Tech savvy crew with higher stats - easy team to use',
    tagline: "We don't write letters, we write history",
    location: 'Auckland CBD based crew',
    leader: 'MASTAMIND',
    leaderTitle: 'University genius, creator of Kai Tiaki AI',
    members: [
      {
        name: 'GHO$',
        alias: 'Ghost',
        description: 'Fake "police officer," actually corporate art auditor and wants to be like his big brother spooker a real ex police officer',
        role: 'Corporate Infiltrator'
      },
      {
        name: 'SPOOK@',
        alias: 'Spook',
        description: 'Ex police officer whose son died and now he\'s an alcoholic. Also owns a million dollar company and tags with his little brother Ghost',
        role: 'Wealthy Benefactor'
      },
      {
        name: 'OX',
        alias: 'Ox',
        description: 'Council worker that acts like a graffiti artist but only wants his artwork up. Plot twist: he\'s the buff man making all drops disappear by buffing them',
        role: 'Saboteur'
      }
    ],
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF'
    },
    style: 'Organized resistance fighters with huge persona (plot twist you\'ll never guess lol)',
    strength: 'Higher base stats, easier for new players',
    personality: 'Deceptive, manipulative, controlling',
    roleInStory: 'System controllers pretending to be resistance',
    motivation: 'To "curate" NZ cities into "aesthetically perfect" spaces for tourism',
    frontDescription: 'Seem like organized resistance fighters, huge persona (plot twist you\'ll never guess lol)',
    reality: 'They created and control The Blackout by going at night time and buffing your drops',
    plotTwist: 'THE VILLAINS IN HERO\'S CLOTHING.. no one should suspect them',
    sideQuestCharacter: {
      name: 'SPONTA',
      description: 'New leader of crew you lose spooker because he dies trying to hit a heaven spot',
      howToUnlock: 'Spooker dies attempting a dangerous heaven spot',
      roleIfJoined: 'Avenging leader who gracefully continues his legacy'
    },
    bonus: 'Higher base stats, crew coordination bonuses'
  },
  {
    id: 'sps',
    name: 'SPONTANEOUS',
    fullName: 'Spontaneous',
    description: 'THE LIGHT BRINGERS',
    tagline: 'Illuminating the darkness',
    location: 'Unknown - nothing gets said inside joke until plot revealed at end of game',
    leader: 'GREGORY',
    leaderTitle: 'Eccentric "green alien" only wears his side bag always naked, delusional but right',
    members: [
      {
        name: 'GINZO',
        description: 'Eccentric female "green alien" obsessed with light/frequency only wears chucks white shirt with denim miniskirt',
        role: 'Frequency Specialist'
      },
      {
        name: 'WIRE',
        description: 'AI BOT built by Greg',
        role: 'Technical Support'
      },
      {
        name: 'STATIC',
        description: 'AI BOT built by Greg for Ginzo with mo AI features then wire. Ginzo knows its fake but rolls her eyes',
        role: 'AI Assistant'
      }
    ],
    colors: {
      primary: '#10B981',
      secondary: '#000000'
    },
    style: 'Glow-in-dark, sound-reactive, interactive installations',
    strength: 'Understands The Blackout\'s frequency-based nature',
    personality: 'Chaotic, creative, festival energy',
    roleInStory: 'Technical disruption specialists',
    motivation: 'Trying to get home secretly by building a portal that takes you home',
    plotTwist: 'These guys are trying to get home secretly building a portal that takes you home when you figure it out, but it\'s too late',
    sideQuestCharacter: {
      name: 'Random Player',
      description: 'People try and join but leader denies cause he\'s using player to help him find parts for teleport',
      howToUnlock: 'Help Greg find portal components',
      roleIfJoined: 'Portal builder assistant'
    },
    bonus: 'Frequency manipulation, light-based abilities'
  },
  {
    id: 'lzt',
    name: 'LUZUNT',
    fullName: 'Luzunt',
    description: 'THE HEALERS',
    tagline: 'Emotional restoration through art',
    location: 'Wiri based crew, Real Street Gang Affiliates',
    leader: 'RASH',
    leaderTitle: 'Therapist turned street artist, cousin of 2 brothers Darrius and Scarrius',
    members: [
      {
        name: 'DARRIUS',
        alias: 'Blue Shark',
        description: 'Obsessed with healing/frequency only wears chucks white shirt with denim miniskirt',
        role: 'Emotional Healer'
      },
      {
        name: 'SCARRIUS',
        alias: 'Blue Shark',
        description: 'Blue shark',
        role: 'Trauma Specialist'
      },
      {
        name: 'CHAOS',
        alias: 'Blue Whale',
        description: 'Very dripsy and does drugs to relief from grief but has all the answers you didn\'t even need to know... lol',
        role: 'Wisdom Keeper'
      }
    ],
    colors: {
      primary: '#87CEEB',
      secondary: '#1E3A8A'
    },
    style: 'Emotion-driven, water-based (temporary), community-focused',
    strength: 'Understands The Blackout erases emotional resonance',
    personality: 'Healing-focused, trauma-informed',
    roleInStory: 'Community mobilization, emotional warfare',
    motivation: 'Help others process trauma through art and emotional support',
    sideQuestCharacter: {
      name: 'OX',
      description: 'Ox falls in love with Chaos and leaves Blaqwt crew still out of grief from Spookas death and loved getting emotional support from Chaos giving away all of Blaqwt plans',
      howToUnlock: 'Ox leaves Blaqwt after emotional connection with Chaos',
      roleIfJoined: 'Defector with insider knowledge'
    },
    bonus: 'Emotional resonance bonuses, community healing abilities'
  },
  {
    id: 'dgc',
    name: 'DON\'T GET CAPPED',
    fullName: 'Don\'t Get Capped',
    description: 'OLD SCHOOL',
    tagline: 'Classic techniques, timeless honor',
    location: 'Rotorua based crew, lives in a sewer with his sons he found in some ooze',
    leader: 'RATMAN',
    leaderTitle: 'aka rata2e, Writing since 1989, Legend on leader board, highest on leader board',
    members: [
      {
        name: 'AMAKI',
        description: 'Found in ooze with brother Imaeki, loves pizza, tends to say "cowabunga dude" a lot to opposite Brown Monkey brother. High IQ member of the pretty dumb but always gets it right pair',
        role: 'Strategy Leader'
      },
      {
        name: 'IMAKI',
        description: 'Found in ooze with brother Amaeki, pretty dumb but always gets it right. When combined with Amaeki they become AIMAKIMAKI',
        role: 'Tactical Support'
      },
      {
        name: 'LUV PIZZA',
        alias: 'CATNIS aka cata2e',
        description: 'Ex convict ripping system. Cat bugluar framed by BLAQWT, also married to RATMAN but doesn\'t write anymore just vibes to music. She\'s an artist and Ratman\'s producer',
        role: 'Music & Vibe Specialist'
      },
      {
        name: 'BROWN MONKEY',
        description: 'The other brother from the ooze, low IQ but always gets it right. The other half of the AIMAKIMAKI combination',
        role: 'Intuition Specialist'
      }
    ],
    colors: {
      primary: '#FF8C00',
      secondary: '#000000'
    },
    style: 'Classic 80s-90s NY style, traditional techniques',
    strength: 'Understands The Blackout targets',
    personality: 'Old-school, honor-based, preservationists. These guys love ninja turtles',
    roleInStory: 'Historical preservation strike force, also a bunch of old hip-hop heads who still b-boy stuck in the 90s vibe',
    motivation: 'Preserve true graffiti culture and protect the art from being erased',
    sideQuestCharacter: {
      name: 'B MAKI & I MAKI',
      description: 'AIMAKI and BI MAKI found each other by revealing that master Ratman had found 4 monkeys in the ooze and when they were little he kicked their ass for being toys and they ran away and another crew down in ngongotaha',
      howToUnlock: 'Discover the truth about the ooze monkeys and Ratman\'s past',
      roleIfJoined: 'Reunited monkey duo with enhanced abilities'
    },
    bonus: 'Traditional technique bonuses, historical knowledge'
  }
];