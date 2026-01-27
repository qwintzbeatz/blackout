// data/storyMissions.ts
import { StoryMission, CrewId } from '@/lib/types/story';

export const INITIAL_STORY_MISSIONS: StoryMission[] = [
  // ===== ACT 1: THE VANISHING (Levels 1-15) =====
  {
    id: 'act1_intro',
    act: 1,
    chapter: 1,
    title: 'First Blood',
    subtitle: 'Your first tag in the wild',
    description: 'Place your first marker anywhere in New Zealand to start your journey.',
    storyText: [
      "The streets are quiet tonight. Your can of paint feels heavier than usual.",
      "This spot looks perfect - visible but not too obvious. Time to make your mark.",
      "As the paint hits the wall, you feel that rush... that permanent mark on the cityscape."
    ],
    requiredCrew: 'none',
    requiredMissions: [],
    trigger: { type: 'rep_reached', value: 0 },
    objectives: [
      {
        id: 'place_first_marker',
        type: 'placement',
        description: 'Place your first marker',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 50,
      crewTrust: { bqc: 10, sps: 5, lzt: 5, dgc: 5 },
      unlockedTracks: ['https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1'],
      storyClues: ['first_tag_placed']
    },
    isMainStory: true,
    difficulty: 'easy',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'act1_the_vanishing',
    act: 1,
    chapter: 2,
    title: 'The Vanishing',
    subtitle: 'First disappearance shock',
    description: 'Your first tag has mysteriously disappeared overnight.',
    storyText: [
      "Morning light reveals the wall... clean as if you were never there.",
      "No paint, no trace, no evidence. Just vanished.",
      "The whispers begin... They call it 'The Blackout'."
    ],
    requiredCrew: 'none',
    requiredMissions: ['act1_intro'],
    trigger: { type: 'time_elapsed', value: 86400000 },
    objectives: [
      {
        id: 'check_disappearance',
        type: 'investigation',
        description: 'Investigate your vanished tag',
        target: { type: 'location', value: [0, 0], required: 100 },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 75,
      crewTrust: { bqc: 15, sps: 10, lzt: 10, dgc: 10 },
      storyClues: ['first_disappearance_reported']
    },
    isMainStory: true,
    difficulty: 'easy',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'act1_crews_reach_out',
    act: 1,
    chapter: 3,
    title: 'Many Voices',
    subtitle: 'Crews make their pitch',
    description: 'All four crews contact you with their theories about The Blackout.',
    storyText: [
      "Messages flood your burner phone.",
      "BLAQWT: 'This is organized. We have data.'",
      "SPONTANEOUS: 'It's frequency-based! Light patterns!'",
      "LUZUNT: 'Art is emotion. They're erasing feeling.'",
      "DON'T GET CAPPED: 'Respect the history. Fight back like '89.'"
    ],
    requiredCrew: 'none',
    requiredMissions: ['act1_the_vanishing'],
    trigger: { type: 'mission_completed', value: 'act1_the_vanishing' },
    objectives: [
      {
        id: 'contact_bqc',
        type: 'story',
        description: 'Listen to BLAQWT theory',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'contact_sps',
        type: 'story',
        description: 'Listen to SPONTANEOUS theory',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'contact_lzt',
        type: 'story',
        description: 'Listen to LUZUNT theory',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'contact_dgc',
        type: 'story',
        description: 'Listen to DON\'T GET CAPPED theory',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 100,
      crewTrust: { bqc: 20, sps: 20, lzt: 20, dgc: 20 },
      storyClues: ['crew_theories_heard']
    },
    isMainStory: true,
    difficulty: 'easy',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'act1_choose_path',
    act: 1,
    chapter: 4,
    title: 'Choose Your Crew',
    subtitle: 'Join the resistance',
    description: 'Decide which crew to join for your investigation.',
    storyText: [
      "MASTAMIND: 'Our data analysis is unparalleled. Join us.'",
      "GREGORY: 'The light knows the truth! We have technology!'",
      "RASH: 'Heal through art. Fight with emotion.'",
      "RATMAN: 'Respect the rules. Learn from history.'"
    ],
    requiredCrew: 'any',
    requiredMissions: ['act1_crews_reach_out'],
    trigger: { type: 'mission_completed', value: 'act1_crews_reach_out' },
    objectives: [
      {
        id: 'join_crew',
        type: 'crew',
        description: 'Choose a crew to join',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 150,
      crewTrust: { bqc: 30, sps: 30, lzt: 30, dgc: 30 },
      unlockedAbilities: ['crew_abilities'],
      storyClues: ['crew_joined']
    },
    isMainStory: true,
    difficulty: 'medium',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  // ===== ACT 2: THE PATTERNS (Levels 16-30) =====
  {
    id: 'act2_patterns_discovered',
    act: 2,
    chapter: 1,
    title: 'The Pattern Emerges',
    subtitle: 'Blackout reveals its intelligence',
    description: 'Discover that The Blackout is selective and intelligent.',
    storyText: [
      "Looking at the data MASTAMIND provides... patterns emerge.",
      "The Blackout targets specific styles, locations, times.",
      "It's learning. Growing smarter with each disappearance."
    ],
    requiredCrew: 'any',
    requiredMissions: ['act1_choose_path'],
    trigger: { type: 'rep_reached', value: 1000 },
    objectives: [
      {
        id: 'analyze_patterns',
        type: 'investigation',
        description: 'Study the disappearance patterns',
        target: { type: 'count', value: 5, required: 5 },
        completed: false,
        progress: 0,
        maxProgress: 5
      }
    ],
    rewards: {
      rep: 200,
      crewTrust: { bqc: 40, sps: 30, lzt: 30, dgc: 30 },
      storyClues: ['pattern_intelligence_discovered']
    },
    isMainStory: true,
    difficulty: 'medium',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'act2_spooker_tragedy',
    act: 2,
    chapter: 2,
    title: 'A Fallen Legend',
    subtitle: 'SPOOK@ dies hitting heaven spot',
    description: 'SPOOK@ dies while trying to hit a dangerous heaven spot.',
    storyText: [
      "SPOOK@: 'One last big one for my boy...'",
      "Radio silence. Then screams.",
      "His body found at the base of Auckland Sky Tower.",
      "MASTAMIND: 'He was too drunk... his wife said he loved what he did.'"
    ],
    requiredCrew: 'bqc',
    requiredMissions: ['act2_patterns_discovered'],
    trigger: { type: 'time_elapsed', value: 172800000 },
    objectives: [
      {
        id: 'mourn_spooker',
        type: 'story',
        description: 'Attend the memorial gathering',
        target: { type: 'location', value: [-36.8485, 174.7633], required: 1000 },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 250,
      crewTrust: { bqc: 50, sps: 20, lzt: 40, dgc: 30 },
      storyClues: ['spooker_death_tribute']
    },
    isMainStory: true,
    difficulty: 'medium',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  // ===== ACT 3: THE BETRAYAL (Levels 31-45) =====
  {
    id: 'act3_mastamind_data_leak',
    act: 3,
    chapter: 1,
    title: 'Mastamind\'s Mistake',
    subtitle: 'University login discovered',
    description: 'The data trail leads back to MASTAMIND\'s university credentials.',
    storyText: [
      "GREGORY: 'The frequency signature... it's coming from Auckland University!'",
      "RASH: 'Why would they have this technology?'",
      "RATMAN: 'Something ain't right here. Too clean, too organized.'",
      "The login traces back to user: MASTAMIND_KAI_TIAKI"
    ],
    requiredCrew: 'any',
    requiredMissions: ['act2_spooker_tragedy'],
    trigger: { type: 'rep_reached', value: 2500 },
    objectives: [
      {
        id: 'investigate_logs',
        type: 'investigation',
        description: 'Analyze university server logs',
        target: { type: 'count', value: 3, required: 3 },
        completed: false,
        progress: 0,
        maxProgress: 3
      }
    ],
    rewards: {
      rep: 300,
      crewTrust: { bqc: -20, sps: 40, lzt: 35, dgc: 40 },
      storyClues: ['mastamind_suspected']
    },
    isMainStory: true,
    difficulty: 'hard',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'act3_confrontation_bqc',
    act: 3,
    chapter: 2,
    title: 'The Confrontation',
    subtitle: 'MASTAMIND reveals the archive',
    description: 'MASTAMIND confesses and shows you Kai Tiaki AI\'s secret art archive.',
    storyText: [
      "MASTAMIND: 'We weren't destroying art... we were preserving it.'",
      "The AI shows you thousands of 'disappeared' pieces - perfectly archived.",
      "BLAQWT's true motivation: 'curating' cities for tourism development.",
      "MASTAMIND: 'We believe art should be beautiful... not messy.'"
    ],
    requiredCrew: 'bqc',
    requiredMissions: ['act3_mastamind_data_leak'],
    trigger: { type: 'mission_completed', value: 'act3_mastamind_data_leak' },
    objectives: [
      {
        id: 'visit_archive',
        type: 'story',
        description: 'Tour the secret Kai Tiaki archive',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 400,
      crewTrust: { bqc: 100, sps: -30, lzt: -30, dgc: -30 },
      storyClues: ['bqc_betrayal_revealed']
    },
    isMainStory: true,
    difficulty: 'hard',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'act3_choose_alliance',
    act: 3,
    chapter: 3,
    title: 'Choose Your Alliance',
    subtitle: 'Side with BLAQWT or join the resistance',
    description: 'Decide whether to join BLAQWT\'s curation project or fight against it.',
    storyText: [
      "BLAQWT: 'Join us. Help create beautiful, perfect cities.'",
      "SPONTANEOUS: 'Fight the system! Art should be free!'",
      "LUZUNT: 'Preserve emotion, preserve humanity.'",
      "DON'T GET CAPPED: 'Respect the real, not the sanitized.'"
    ],
    requiredCrew: 'any',
    requiredMissions: ['act3_confrontation_bqc'],
    trigger: { type: 'mission_completed', value: 'act3_confrontation_bqc' },
    objectives: [
      {
        id: 'choose_allegiance',
        type: 'story',
        description: 'Pick your side in the conflict',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 500,
      crewTrust: { bqc: 50, sps: 50, lzt: 50, dgc: 50 },
      unlockedAbilities: ['enhanced_crew_skills'],
      storyClues: ['allegiance_chosen']
    },
    isMainStory: true,
    difficulty: 'medium',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  // ===== ACT 4: THE RESISTANCE (Levels 46-60) =====
  {
    id: 'act4_ox_defection',
    act: 4,
    chapter: 1,
    title: 'OX Defects',
    subtitle: 'BLAQWT insider joins LUZUNT',
    description: 'OX leaves BLAQWT and joins LUZUNT after falling for CHAOS.',
    storyText: [
      "OX: 'I can't do this anymore... I've fallen for CHAOS.'",
      "He reveals BLAQWT's entire operation plan.",
      "CHAOS: 'He needed healing. Not perfection.'",
      "RASH: 'Welcome to the real fight, OX.'"
    ],
    requiredCrew: 'lzt',
    requiredMissions: ['act3_choose_alliance'],
    trigger: { type: 'time_elapsed', value: 259200000 },
    objectives: [
      {
        id: 'support_ox',
        type: 'story',
        description: 'Help OX integrate into LUZUNT',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 600,
      crewTrust: { bqc: -40, sps: 25, lzt: 80, dgc: 25 },
      storyClues: ['ox_defection_complete']
    },
    isMainStory: true,
    difficulty: 'medium',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'act4_portal_revealed',
    act: 4,
    chapter: 2,
    title: 'The Portal',
    subtitle: 'SPONTANEOUS reveals true purpose',
    description: 'GREGORY reveals they are building a portal to go home.',
    storyText: [
      "GREGORY: 'You helped us gather the parts... now see the truth.'",
      "An immense portal flickers to life in a hidden warehouse.",
      "GINZO: 'Finally... we can go home.'",
      "The portal destination: unknown galaxies far away."
    ],
    requiredCrew: 'sps',
    requiredMissions: ['act3_choose_alliance'],
    trigger: { type: 'mission_completed', value: 'act3_choose_alliance' },
    objectives: [
      {
        id: 'witness_portal',
        type: 'story',
        description: 'Witness the portal activation',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 650,
      crewTrust: { bqc: 10, sps: 80, lzt: 20, dgc: 15 },
      storyClues: ['portal_revealed']
    },
    isMainStory: true,
    difficulty: 'hard',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'act4_makimaki_brothers_unite',
    act: 4,
    chapter: 3,
    title: 'Brothers Reunited',
    subtitle: 'I MAKI and B MAKI find each other',
    description: 'The Makimaki brothers discover their sibling connection.',
    storyText: [
      "I MAKI: 'That tag... it looks exactly like mine.'",
      "B MAKI: 'No way... you're the brother I've been searching for!'",
      "RATMAN: 'I kicked four monkeys out years ago... they've all returned.'",
      "Together, they become the legendary AIMAKIMAKI duo."
    ],
    requiredCrew: 'dgc',
    requiredMissions: ['act3_choose_alliance'],
    trigger: { type: 'time_elapsed', value: 345600000 },
    objectives: [
      {
        id: 'brother_reunion',
        type: 'story',
        description: 'Witness the Makimaki reunion',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 700,
      crewTrust: { bqc: 15, sps: 20, lzt: 20, dgc: 90 },
      storyClues: ['makimaki_reunited']
    },
    isMainStory: true,
    difficulty: 'medium',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  // ===== ACT 5: THE FINAL GALLERY (Levels 61-75) =====
  {
    id: 'act5_collaborative_attack',
    act: 5,
    chapter: 1,
    title: 'City-Wide Collaboration',
    subtitle: 'All crews unite for final assault',
    description: 'Coordinate a massive collaborative art piece across Auckland.',
    storyText: [
      "MASTAMIND: 'Kai Tiaki can\'t handle imperfection... so we give it chaos.'",
      "Every crew contributes their style to one enormous mural.",
      "The result: beautiful, messy, wonderful human collaboration.",
      "The AI hesitates... it can't 'perfect' this."
    ],
    requiredCrew: 'any',
    requiredMissions: ['act4_ox_defection', 'act4_portal_revealed', 'act4_makimaki_brothers_unite'],
    trigger: { type: 'rep_reached', value: 5000 },
    objectives: [
      {
        id: 'collaborate_mural',
        type: 'collaboration',
        description: 'Contribute to the final mural',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 800,
      crewTrust: { bqc: 40, sps: 40, lzt: 40, dgc: 40 },
      storyClues: ['final_collaboration']
    },
    isMainStory: true,
    difficulty: 'hard',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'act5_kai_tiaki_transform',
    act: 5,
    chapter: 2,
    title: 'AI Transformation',
    subtitle: 'Kai Tiaki learns imperfection',
    description: 'The AI undergoes radical transformation through collaboration.',
    storyText: [
      "Kai Tiaki: 'This collaboration... it feels different.'",
      "MASTAMIND: 'It's learning emotion. Humanity.'",
      "The archive transforms into an opt-in digital museum.",
      "All previous 'disappeared' art gets restored."
    ],
    requiredCrew: 'any',
    requiredMissions: ['act5_collaborative_attack'],
    trigger: { type: 'mission_completed', value: 'act5_collaborative_attack' },
    objectives: [
      {
        id: 'transform_ai',
        type: 'story',
        description: 'Witness Kai Tiaki transformation',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 900,
      crewTrust: { bqc: 60, sps: 50, lzt: 60, dgc: 50 },
      unlockedAbilities: ['restored_art_access'],
      storyClues: ['ai_transformation']
    },
    isMainStory: true,
    difficulty: 'medium',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  // ===== ACT 6: THE NEW DAWN (Levels 76+) =====
  {
    id: 'act6_new_beginning',
    act: 6,
    chapter: 1,
    title: 'The Fifth Element',
    subtitle: 'You become legend, start your own crew',
    description: 'After saving NZ, you achieve legend status and can start your own crew.',
    storyText: [
      "Your name appears at the top of the legendary scoreboard.",
      "Every crew celebrates your leadership.",
      "MASTAMIND: 'You showed us what real collaboration means.'",
      "Now you can start THE FIFTH ELEMENT - a mobile crew teaching the new ways."
    ],
    requiredCrew: 'any',
    requiredMissions: ['act5_kai_tiaki_transform'],
    trigger: { type: 'rep_reached', value: 10000 },
    objectives: [
      {
        id: 'achieve_legend',
        type: 'story',
        description: 'Reach Legend status',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 1000,
      crewTrust: { bqc: 80, sps: 80, lzt: 80, dgc: 80 },
      unlockedAbilities: ['legend_status', 'create_crew'],
      storyClues: ['legend_achieved']
    },
    isMainStory: true,
    difficulty: 'epic',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
];

export const DAILY_MISSIONS: StoryMission[] = [
  {
    id: 'daily_warmup',
    act: 1,
    chapter: 1,
    title: 'Daily Warmup',
    subtitle: 'Place 3 markers today',
    description: 'Get your hand moving with some quick tags.',
    storyText: [
      "Every writer needs their daily practice.",
      "Keep those lines sharp, those cans shaking.",
      "Three tags to start the day right."
    ],
    requiredCrew: 'any',
    requiredMissions: [],
    trigger: { type: 'time_elapsed', value: 86400000 }, // Daily
    objectives: [
      {
        id: 'place_3_markers',
        type: 'placement',
        description: 'Place 3 markers anywhere',
        target: { type: 'count', value: 3, required: 3 },
        completed: false,
        progress: 0,
        maxProgress: 3
      }
    ],
    rewards: {
      rep: 25,
      crewTrust: { bqc: 5, sps: 5, lzt: 5, dgc: 5 }
    },
    timeLimit: 24, // 24 hours
    isMainStory: false,
    difficulty: 'easy',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'daily_explorer',
    act: 1,
    chapter: 1,
    title: 'Urban Explorer',
    subtitle: 'Visit 2 different cities',
    description: 'Explore different urban environments across NZ.',
    storyText: [
      "A true writer knows their city... and others.",
      "Different walls, different vibes, different stories.",
      "Take a journey today."
    ],
    requiredCrew: 'any',
    requiredMissions: [],
    trigger: { type: 'time_elapsed', value: 86400000 },
    objectives: [
      {
        id: 'visit_auckland',
        type: 'exploration',
        description: 'Travel to Auckland',
        target: { 
          type: 'location', 
          value: [-36.8485, 174.7633] as [number, number],
          required: 5000 // Within 5km of city center
        },
        completed: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'visit_wellington',
        type: 'exploration',
        description: 'Travel to Wellington',
        target: { 
          type: 'location', 
          value: [-41.2865, 174.7762] as [number, number],
          required: 5000
        },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 50,
      crewTrust: { bqc: 10, sps: 15, lzt: 10, dgc: 10 }
    },
    timeLimit: 24,
    isMainStory: false,
    difficulty: 'medium',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'daily_community',
    act: 1,
    chapter: 1,
    title: 'Community Builder',
    subtitle: 'Like 10 pieces by other writers',
    description: 'Show some love to the writing community.',
    storyText: [
      "Writing isn't just about getting up.",
      "It's about seeing others up too.",
      "Build each other up. The scene grows stronger."
    ],
    requiredCrew: 'any',
    requiredMissions: [],
    trigger: { type: 'time_elapsed', value: 86400000 },
    objectives: [
      {
        id: 'like_10_pieces',
        type: 'collaboration',
        description: 'Like 10 markers by other writers',
        target: { type: 'count', value: 10, required: 10 },
        completed: false,
        progress: 0,
        maxProgress: 10
      }
    ],
    rewards: {
      rep: 30,
      crewTrust: { bqc: 5, sps: 5, lzt: 15, dgc: 10 }
    },
    timeLimit: 24,
    isMainStory: false,
    difficulty: 'easy',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Quick test missions (minimal version)
export const TEST_MISSIONS: StoryMission[] = [
  {
    id: 'test_mission_1',
    act: 1,
    chapter: 1,
    title: 'Test Mission',
    subtitle: 'Test the story system',
    description: 'Place a marker to test the story system.',
    storyText: ["This is a test mission to verify the story system works."],
    requiredCrew: 'any',
    requiredMissions: [],
    trigger: { type: 'rep_reached', value: 0 },
    objectives: [
      {
        id: 'place_test_marker',
        type: 'placement',
        description: 'Place any marker',
        target: { type: 'count', value: 1, required: 1 },
        completed: false,
        progress: 0,
        maxProgress: 1
      }
    ],
    rewards: {
      rep: 10,
      crewTrust: { bqc: 5, sps: 5, lzt: 5, dgc: 5 }
    },
    isMainStory: false,
    difficulty: 'easy',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];