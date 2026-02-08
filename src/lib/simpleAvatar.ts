// Simple Avatar Generator for Blackout NZ Graffiti GPS App
// Replaces DiceBear with emoji-based SVG avatars

export function createAvatar(userId: string, username: string, gender: string): string {
  const seed = username || userId;
  let text = 'U';
  let color = '#4dabf7';
  
  if (gender === 'male') { text = 'M'; color = '#3b82f6'; }
  else if (gender === 'female') { text = 'F'; color = '#ec4899'; }
  else if (gender === 'other') { text = 'A'; color = '#10b981'; }
  else if (gender === 'prefer-not-to-say') { text = 'R'; color = '#6b7280'; }
  
  const svg = `<svg width="200" height="200" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="90" fill="${color}" opacity="0.2"/>
    <text x="100" y="120" font-size="80" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">${text}</text>
  </svg>`;
  
  function utf8ToB64(str: string): string {
    return Buffer.from(unescape(encodeURIComponent(str)), 'binary').toString('base64');
  }
  return `data:image/svg+xml;base64,${utf8ToB64(svg)}`;
}
