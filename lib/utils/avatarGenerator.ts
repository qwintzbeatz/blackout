// Avatar generation utility with gender-specific styles
export const generateAvatarUrl = (
  userId: string, 
  username: string, 
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say',
  size: number = 60
): string => {
  const seed = username || userId;
  
  // Define avatar styles based on gender
  let avatarStyle = 'open-peeps'; // default style
  
  if (gender === 'male') {
    avatarStyle = 'adventurer'; // boyish/ masculine style
  } else if (gender === 'female') {
    avatarStyle = 'avataaars'; // girlish/ feminine style
  } else if (gender === 'other') {
    avatarStyle = 'bottts'; // alien/robot style for 'other'
  } else if (gender === 'prefer-not-to-say') {
    avatarStyle = 'identicon'; // android/geometric style
  }
  
  // Color palette for avatars
  const colors = [
    '4dabf7', '10b981', '8b5cf6', 'f59e0b', 'ec4899', 'f97316',
    '3b82f6', '06b6d4', '8b5cf6', 'ef4444', '84cc16', '14b8a6'
  ];
  const selectedColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Construct URL based on style
  let url = '';
  
  switch (avatarStyle) {
    case 'adventurer': // Male (boyish)
      url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      break;
      
    case 'avataaars': // Female (girlish)
      url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      break;
      
    case 'bottts': // Other (alien/robot)
      url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      break;
      
    case 'identicon': // Prefer not to say (android/geometric)
      url = `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      break;
      
    default: // open-peeps as fallback
      url = `https://api.dicebear.com/7.x/open-peeps/svg?seed=${seed}&backgroundColor=${selectedColor}`;
  }
  
  return url;
};