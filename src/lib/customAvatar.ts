export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const getSeedFromUsername = (username: string): number => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const generateMaleSVG = (seed: number): string => {
  const skinColor = ['#ffdbac', '#f1c27d', '#e0ac69'][Math.floor(seededRandom(seed * 1) * 3)];
  const hairColor = ['#2d3436', '#636e72', '#6d4c41'][Math.floor(seededRandom(seed * 2) * 3)];
  const shirtColor = ['#e74c3c', '#3498db', '#2ecc71'][Math.floor(seededRandom(seed * 3) * 3)];
  const hairStyle = Math.floor(seededRandom(seed * 4) * 3);
  const hairPaths = [`<ellipse cx="75" cy="45" rx="35" ry="20" fill="${hairColor}"/>`, `<path d="M50 45 Q70 30 90 45 Q100 50 100 55 Q100 60 95 60 L95 50 Q85 35 70 40 Q60 35 50 50 L50 60 Q45 60 45 55 Q45 50 50 45" fill="${hairColor}"/>`, `<path d="M40 55 L45 35 L55 50 L65 30 L75 50 L85 35 L90 55 Z" fill="${hairColor}"/>`];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150"><circle cx="75" cy="75" r="70" fill="#f5f5f5"/><path d="M30 130 Q75 145 120 130 L120 150 L30 150 Z" fill="${shirtColor}"/><rect x="60" y="100" width="30" height="25" fill="${skinColor}"/><ellipse cx="75" cy="70" rx="40" ry="45" fill="${skinColor}"/>${hairPaths[hairStyle]}<ellipse cx="35" cy="70" rx="8" ry="12" fill="${skinColor}"/><ellipse cx="115" cy="70" rx="8" ry="12" fill="${skinColor}"/><circle cx="60" cy="80" r="6" fill="white"/><circle cx="60" cy="80" r="3" fill="#2d3436"/><circle cx="90" cy="80" r="6" fill="white"/><circle cx="90" cy="80" r="3" fill="#2d3436"/><path d="M75 85 L72 95 L78 95 Z" fill="${skinColor}" opacity="0.5"/><path d="M60 105 Q75 115 90 105" stroke="#c0392b" stroke-width="3" fill="none"/></svg>`;
};

const generateFemaleSVG = (seed: number): string => {
  const skinColor = ['#ffdbac', '#f1c27d', '#e0ac69'][Math.floor(seededRandom(seed * 7) * 3)];
  const hairColor = ['#2d3436', '#e17055', '#fdcb6e'][Math.floor(seededRandom(seed * 8) * 3)];
  const clothesColor = ['#e84393', '#fd79a8', '#00cec9'][Math.floor(seededRandom(seed * 9) * 3)];
  const hairStyle = Math.floor(seededRandom(seed * 10) * 3);
  const hairPaths = [`<path d="M35 75 Q35 25 75 20 Q115 25 115 75 L115 100 Q115 110 105 100 Q95 120 75 120 Q55 120 45 100 Q35 110 35 100 Z" fill="${hairColor}"/>`, `<ellipse cx="75" cy="40" rx="40" ry="25" fill="${hairColor}"/><path d="M35 75 L50 100 L30 90 Z" fill="${hairColor}"/><path d="M115 75 L100 100 L120 90 Z" fill="${hairColor}"/>`, `<path d="M35 60 Q40 30 75 25 Q110 30 115 60 L120 120 Q110 130 100 120 L100 70 Q90 80 75 80 Q60 80 50 70 L50 120 Q40 130 30 120 Z" fill="${hairColor}"/>`];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150"><circle cx="75" cy="75" r="70" fill="#faf0f6"/><path d="M35 130 Q75 145 115 130 L115 150 L35 150 Z" fill="${clothesColor}"/><rect x="62" y="100" width="26" height="20" fill="${skinColor}"/><ellipse cx="75" cy="70" rx="38" ry="42" fill="${skinColor}"/>${hairPaths[hairStyle]}<ellipse cx="37" cy="72" rx="6" ry="10" fill="${skinColor}"/><ellipse cx="113" cy="72" rx="6" ry="10" fill="${skinColor}"/><ellipse cx="58" cy="75" rx="7" ry="5" fill="white"/><circle cx="58" cy="75" r="3" fill="#6c5ce7"/><ellipse cx="92" cy="75" rx="7" ry="5" fill="white"/><circle cx="92" cy="75" r="3" fill="#6c5ce7"/><path d="M75 82 L72 90 Q75 93 78 90 Z" fill="${skinColor}" opacity="0.5"/><path d="M62 105 Q75 115 88 105" stroke="#e17055" stroke-width="2" fill="none"/><ellipse cx="50" cy="92" rx="8" ry="5" fill="#ffb6c1" opacity="0.5"/><ellipse cx="100" cy="92" rx="8" ry="5" fill="#ffb6c1" opacity="0.5"/></svg>`;
};

const generateAlienSVG = (seed: number): string => {
  const skinColor = ['#00b894', '#55efc4', '#74b9ff'][Math.floor(seededRandom(seed * 13) * 3)];
  const headShape = Math.floor(seededRandom(seed * 16) * 3);
  const headPaths = [`<ellipse cx="75" cy="70" rx="45" ry="50" fill="${skinColor}"/>`, `<path d="M35 70 Q35 20 75 15 Q115 20 115 70 Q120 100 100 120 Q75 130 50 120 Q30 100 35 70 Z" fill="${skinColor}"/>`, `<path d="M30 90 Q40 30 75 25 Q110 30 120 90 Q125 110 100 120 Q75 125 50 120 Q25 110 30 90 Z" fill="${skinColor}"/>`];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150"><circle cx="75" cy="75" r="70" fill="#1a1a2e"/><ellipse cx="75" cy="110" rx="40" ry="25" fill="${skinColor}" opacity="0.5"/>${headPaths[headShape]}<ellipse cx="55" cy="75" rx="18" ry="22" fill="white"/><ellipse cx="55" cy="75" rx="6" ry="10" fill="#2d3436"/><ellipse cx="95" cy="75" rx="18" ry="22" fill="white"/><ellipse cx="95" cy="75" rx="6" ry="10" fill="#2d3436"/><path d="M60 25 L50 5" stroke="${skinColor}" stroke-width="4"/><circle cx="50" cy="5" r="6" fill="${skinColor}"/><path d="M90 25 L100 5" stroke="${skinColor}" stroke-width="4"/><circle cx="100" cy="5" r="6" fill="${skinColor}"/><ellipse cx="75" cy="115" rx="8" ry="5" fill="#00b894" opacity="0.7"/><ellipse cx="75" cy="115" rx="12" ry="8" fill="#00b894"/></svg>`;
};

const generateRobotSVG = (seed: number): string => {
  const bodyColor = ['#636e72', '#b2bec3', '#74b9ff'][Math.floor(seededRandom(seed * 19) * 3)];
  const eyeColor = ['#74b9ff', '#00cec9', '#fd79a8'][Math.floor(seededRandom(seed * 20) * 3)];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150"><circle cx="75" cy="75" r="70" fill="#dfe6e9"/><rect x="35" y="45" width="80" height="70" rx="10" fill="${bodyColor}"/><rect x="30" y="100" width="90" height="35" rx="5" fill="${bodyColor}"/><rect x="72" y="15" width="6" height="20" fill="${bodyColor}"/><circle cx="75" cy="5" r="8" fill="${bodyColor}"/><rect x="50" y="55" width="20" height="15" rx="3" fill="#2d3436"/><rect x="80" y="55" width="20" height="15" rx="3" fill="#2d3436"/><circle cx="60" cy="62" r="5" fill="${eyeColor}"/><circle cx="90" cy="62" r="5" fill="${eyeColor}"/><rect x="55" y="85" width="40" height="10" rx="2" fill="#2d3436"/><rect x="60" y="88" width="30" height="4" rx="1" fill="${eyeColor}"/></svg>`;
};

export async function generateRandomAvatar(userId: string, username: string, gender?: string): Promise<string> {
  const seed = getSeedFromUsername(username || userId);
  let svg: string;
  
  switch (gender) {
    case 'male':
      svg = generateMaleSVG(seed);
      break;
    case 'female':
      svg = generateFemaleSVG(seed);
      break;
    case 'other':
      svg = generateAlienSVG(seed);
      break;
    case 'prefer-not-to-say':
    default:
      svg = generateRobotSVG(seed);
      break;
  }
  
  function utf8ToB64(str: string): string {
    return Buffer.from(unescape(encodeURIComponent(str)), 'binary').toString('base64');
  }
  return 'data:image/svg+xml;base64,' + utf8ToB64(svg);
}
