// data/crews.ts
import { Crew } from '@/lib/types/blackout';

export const CREWS: Crew[] = [
  {
    id: 'bqc',
    name: 'BLAQWT',
    fullName: 'BLAQWT CREW (BQC)',
    description: 'Tech-savvy resistance fighters. Organized, data-driven.',
    leader: 'MASTAMIND',
    leaderBio: 'University genius, creator of the Kai Tiaki AI. Appears helpful but hides a dark secret.',
    color: '#000000',
    accentColor: '#ffffff',
    bonus: '+10% scanning accuracy, +15% data analysis',
    style: 'Clean, precise, corporate-influenced',
    motivation: 'To "curate" NZ cities into "aesthetically perfect" spaces for tourism',
    plotTwist: 'THEY CREATED THE BLACKOUT. Going out at night to buff drops and control the narrative.',
    members: [
      {
        name: 'MASTAMIND',
        role: 'Leader / AI Creator',
        description: 'University genius who created Kai Tiaki AI. Secretly controls The Blackout.',
        secret: 'Horrified by what his creation became but trapped by corporate backers.'
      },
      {
        name: 'GHO$',
        role: 'Corporate Art Auditor',
        description: 'Poses as police officer. Actually audits street art for removal.',
        secret: 'Wants to be like his big brother SPOOK@. Knows the truth but stays loyal.'
      },
      {
        name: 'SPOOK@',
        role: 'Ex-Police / Millionaire',
        description: 'Owns buffing company. Alcoholic after son died. Tags with GHO$.',
        secret: 'His company does the actual buffing. Dies trying to hit a heaven spot while drunk.'
      },
      {
        name: 'OX',
        role: 'Council Worker / Mole',
        description: 'Pretends to be graffiti artist. Actually marks pieces for removal.',
        secret: 'Falls in love with CHAOS from LUZUNT and defects, revealing BLAQWT plans.'
      }
    ]
  },
  {
    id: 'sps',
    name: 'SPONTANEOUS',
    fullName: 'SPONTANEOUS (SPS)',
    description: 'Light bringers. Chaotic, creative, frequency-based.',
    leader: 'GREGORY',
    leaderBio: 'Eccentric "green alien" obsessed with light frequencies. Building a portal home.',
    color: '#10b981',
    accentColor: '#000000',
    bonus: '+15% night visibility, +20% glow effects',
    style: 'Glow-in-dark, sound-reactive, interactive',
    motivation: 'Understanding The Blackout frequency to build a portal home',
    plotTwist: 'Secretly using players to find parts for their teleportation device.',
    members: [
      {
        name: 'GREGORY',
        role: 'Leader / Alien',
        description: 'Always naked, wears only side bag. Obsessed with light frequencies.',
        secret: 'Building a portal to return home. Using players to gather components.'
      },
      {
        name: 'GINZO',
        role: 'Alien Scientist',
        description: 'Female "green alien". Obsessed with sound frequencies.',
        secret: 'Knows GREGORY\'s AI bots are fake but plays along.'
      },
      {
        name: 'WIRE',
        role: 'AI Bot',
        description: 'AI built by Greg. Emotionless but efficient.',
        secret: 'Actually learning human emotions from observing players.'
      },
      {
        name: 'STATIC',
        role: 'AI Bot',
        description: 'AI built by Greg for Ginzo. More advanced features.',
        secret: 'Developing sentience and questioning its purpose.'
      }
    ]
  },
  {
    id: 'lzt',
    name: 'LUZUNT',
    fullName: 'LUZUNT (LZT)',
    description: 'The healers. Emotion-driven, community-focused.',
    leader: 'RASH',
    leaderBio: 'Therapist turned street artist. Cousin of DARRIUS and SCARRIUS.',
    color: '#4dabf7',
    accentColor: '#ffffff',
    bonus: '+20% collaboration REP, +15% emotional impact',
    style: 'Water-based (temporary), emotion-driven, community art',
    motivation: 'Healing community trauma through art, fighting emotional erasure',
    plotTwist: 'Take players for ocean tags, giving first "heaven spot" experience.',
    members: [
      {
        name: 'RASH',
        role: 'Leader / Therapist',
        description: 'Therapist using art for healing. Cousin of the blue shark twins.',
        secret: 'Knows OX from BLAQWT has feelings for CHAOS, uses this to gain intel.'
      },
      {
        name: 'DARRIUS',
        role: 'Blue Shark Twin',
        description: 'Eccentric female "blue shark". Obsessed with ocean frequencies.',
        secret: 'Can hear The Blackout\'s frequency. Working on a counter-frequency.'
      },
      {
        name: 'SCARRIUS',
        role: 'Blue Shark Twin',
        description: 'Other blue shark twin. More aggressive than Darrius.',
        secret: 'Has underwater connections for hard-to-reach spots.'
      },
      {
        name: 'CHAOS',
        role: 'Blue Whale / Drug User',
        description: 'Uses drugs to cope with grief. Surprisingly insightful.',
        secret: 'OX from BLAQWT falls in love with her, causing his defection.'
      }
    ]
  },
  {
    id: 'dgc',
    name: 'DON\'T GET CAPPED',
    fullName: 'DON\'T GET CAPPED (DGC)',
    description: 'Old school preservationists. Traditional techniques.',
    leader: 'RATMAN (rata2e)',
    leaderBio: 'Writing since 1989. Legend with highest leaderboard score.',
    color: '#f59e0b',
    accentColor: '#000000',
    bonus: '+25% marker longevity, +15% traditional style bonus',
    style: 'Classic 80s-90s NY style, traditional techniques',
    motivation: 'Preserving graffiti history, fighting corporate sanitization',
    plotTwist: 'RATMAN found 4 monkeys in ooze, kicked them out for being toys.',
    members: [
      {
        name: 'RATMAN (rata2e)',
        role: 'Leader / Legend',
        description: 'Writing since 1989. Highest on leaderboard. Married to CATNIS.',
        secret: 'Found 4 monkeys in ooze, raised them, kicked them out for being toys.'
      },
      {
        name: 'CATNIS (cata2e)',
        role: 'Ex-Convict / Artist',
        description: 'Framed by BLAQWT. Doesn\'t write anymore, just vibes music.',
        secret: 'Knows where the 4 monkeys are now. Secretly helps them.'
      },
      {
        name: 'AMAKI',
        role: 'Monkey Son 1',
        description: 'High IQ. Loves pizza. Says "cowagunja DUDE" constantly.',
        secret: 'Actually AIMAKI when combined with IMAKI. Looking for his brother.'
      },
      {
        name: 'IMAKI',
        role: 'Monkey Son 2',
        description: 'Pretty dumb but always right. Loves pizza.',
        secret: 'Actually BIMAKI when alone. Sees his tag style copied elsewhere.'
      }
    ]
  }
];

export const CREW_COLORS: Record<string, string> = {
  bqc: '#000000',
  sps: '#10b981',
  lzt: '#4dabf7',
  dgc: '#f59e0b'
};

export const CREW_ICONS: Record<string, string> = {
  bqc: '🤖',
  sps: '👽',
  lzt: '🦈',
  dgc: '🐀'
};

export const getCrewById = (id: string | null): Crew | undefined => {
  return CREWS.find(crew => crew.id === id);
};

export const getCrewColor = (id: string | null): string => {
  return CREW_COLORS[id || ''] || '#6b7280';
};

export const getCrewIcon = (id: string | null): string => {
  return CREW_ICONS[id || ''] || '👤';
};