
import { ReadingHistory } from '../types';

export interface UserProfile {
  username: string;
  avatarUrl: string;
  totalReadingTimeSeconds: number;
  isGuest: boolean;
}

const PROFILE_KEY = 'omni_profile';

export const syncReadingProgress = async (history: ReadingHistory) => {
  const saved = localStorage.getItem('omni_history');
  const currentHistory = saved ? JSON.parse(saved) : {};
  currentHistory[history.seriesId] = history;
  localStorage.setItem('omni_history', JSON.stringify(currentHistory));
  return { success: true };
};

export const syncReadingTime = async (seconds: number) => {
  const profile = await getUserProfile();
  profile.totalReadingTimeSeconds += seconds;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getUserProfile = async (): Promise<UserProfile> => {
  const saved = localStorage.getItem(PROFILE_KEY);
  if (saved) return JSON.parse(saved);
  
  return {
    username: "Invité",
    avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=Guest&backgroundColor=b6e3f4`,
    totalReadingTimeSeconds: 0,
    isGuest: true
  };
};

export const saveUserProfile = async (username: string, isGuest: boolean = false) => {
  const profile: UserProfile = {
    username: username || "Invité",
    avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${username || 'Guest'}&backgroundColor=c0aede`,
    totalReadingTimeSeconds: 0,
    isGuest
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
};

export const formatReadingTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}H ${m}M`;
  return `${m}M`;
};

export const signOut = async () => {
  localStorage.removeItem(PROFILE_KEY);
  // On vide aussi les autres données pour une déconnexion propre si nécessaire
  // localStorage.clear(); // Optionnel : décommenter pour tout raser
  window.location.reload();
};
