export const generateAvatarUrl = (
  userId: string,
  username: string,
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say',
  size: number = 60,
  backgroundColor?: string
): string => {
  // Create VERY different seeds for different genders
  let seed = username || userId;
  
  // Add gender prefix that will generate different looking avatars
  if (gender === 'female') {
    seed = `female-${seed}`; // "female-" prefix
  } else if (gender === 'male') {
    seed = `male-${seed}`; // "male-" prefix
  } else if (gender === 'other') {
    seed = `neutral-${seed}`; // "neutral-" prefix
  } else {
    seed = `default-${seed}`; // "default-" prefix
  }
  
  // Set color based on gender
  let selectedColor = backgroundColor;
  
  if (!selectedColor) {
    switch (gender) {
      case 'male':
        selectedColor = '4dabf7'; // Blue
        break;
      case 'female':
        selectedColor = 'ec4899'; // Pink
        break;
      case 'other':
        selectedColor = '10b981'; // Green
        break;
      case 'prefer-not-to-say':
        selectedColor = '6b7280'; // Grey
        break;
      default:
        selectedColor = '6b7280'; // Grey
    }
  }
  
  // Remove # if present
  selectedColor = selectedColor.replace('#', '');
  
  // Simple URL - no extra parameters
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}&size=${size}`;
};