// REP calculation functions
export const calculateRepForMarker = (distanceFromCenter: number | null, description: string): number => {
  let rep = 10; // Base REP for placing any marker
  
  if (distanceFromCenter && distanceFromCenter <= 50) {
    rep += 5;
  }
  
  switch (description) {
    case 'Piece/Bombing':
    case 'Burner/Heater':
      rep += 15;
      break;
    case 'Throw-Up':
    case 'Roller/Blockbuster':
      rep += 10;
      break;
    case 'Stencil/Brand/Stamp':
    case 'Paste-Up/Poster':
      rep += 8;
      break;
    case 'Tag/Signature':
      rep += 5;
      break;
    default:
      rep += 3;
  }
  
  return rep;
};

export const calculateRank = (rep: number): string => {
  if (rep >= 300) return 'WRITER';
  if (rep >= 100) return 'VANDAL';
  return 'TOY';
};

export const calculateLevel = (rep: number): number => {
  return Math.floor(rep / 100) + 1;
};

// Streak bonus calculation
export const calculateStreakBonus = (): number => {
  // This would typically check if user placed a marker today
  // For now, returning 0
  return 0;
};