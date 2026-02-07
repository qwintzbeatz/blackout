// Avatar generation utility with gender-specific styles
export const generateAvatarUrl = (
  userId: string,
  username: string,
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say',
  size: number = 60,
  backgroundColor?: string
): string => {
  const seed = username || userId;
  
  // Use provided background color (e.g., crew color), or default to white
  const selectedColor = backgroundColor || 'ffffff';
  
  // Create base URL
  let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}`;
  
  // Add size parameter (DiceBear accepts size parameter)
  url += `&size=${size}`;
  
  // Apply gender-specific styling if specified
  if (gender && gender !== 'prefer-not-to-say' && gender !== 'other') {
    // DiceBear doesn't have direct gender parameter, but we can adjust style
    // options to be more gender-typical if desired
    if (gender === 'female') {
      url += '&top[]=longHair&facialHairProbability=0';
    } else if (gender === 'male') {
      url += '&facialHairProbability=30&top[]=shortHair';
    }
  }
  
  // Additional customization for "other" or neutral presentation
  if (gender === 'other') {
    // Use more neutral/versatile options
    url += '&top[]=hat&facialHairProbability=0';
  }
  
  return url;
};
