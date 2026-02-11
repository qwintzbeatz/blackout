export interface Character {
  id: string;
  name: string;
  crewId: 'BQC' | 'SPS' | 'LZT' | 'DGC';
  description: string;
  isLeader: boolean;
  animal: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  avatarBackgroundColor?: string;
}
