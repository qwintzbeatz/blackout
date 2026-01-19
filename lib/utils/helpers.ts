// Helper function to calculate distance between two coordinates in meters
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Avatar generator function
export const generateAvatarUrl = (userId: string, username: string, gender?: string): string => {
  // Use DiceBear API for free avatars
  const seed = username || userId;
  const colors = ['4dabf7', '10b981', '8b5cf6', 'f59e0b', 'ec4899', 'f97316'];
  const selectedColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Build the DiceBear URL
  let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}`;
  
  // Add optional features based on gender
  if (gender === 'male' && Math.random() > 0.5) {
    url += '&facialHair=beard';
  }
  
  return url;
};