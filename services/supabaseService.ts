
import { ReadingHistory } from '../types';

export interface UserProfile {
  username: string;
  avatarUrl: string;
  totalReadingTime: string;
}

/**
 * Simulates an UPSERT into the 'reading_history' table in Supabase.
 */
export const syncReadingProgress = async (history: ReadingHistory) => {
  console.log('[Supabase] UPSERT reading_history:', {
    webtoon_id: history.seriesId,
    chapter_id: history.chapterId,
    scroll_percent: Math.round(history.scrollPosition),
    last_read: new Date(history.lastRead).toISOString()
  });
  
  // Persist locally for the demo app's reactivity
  const saved = localStorage.getItem('omni_history');
  const currentHistory = saved ? JSON.parse(saved) : {};
  currentHistory[history.seriesId] = history;
  localStorage.setItem('omni_history', JSON.stringify(currentHistory));

  return { success: true };
};

export const syncReadingTime = async (seconds: number) => {
  console.log('[Supabase] Syncing total reading time...', seconds);
};

export const getUserProfile = async (): Promise<UserProfile> => {
  return {
    username: "Sung Jin-Woo",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jinwoo",
    totalReadingTime: "42h 15m"
  };
};

export const signOut = async () => {
  console.log('[Supabase] Signing out...');
  window.location.reload();
};
