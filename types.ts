
export interface Page {
  url: string;
  order: number;
}

export interface Chapter {
  id: string;
  title: string;
  number: number;
  pages: string[];
}

export type SeriesStatus = 'en_cours' | 'termine';

export interface Series {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  chapters: Chapter[];
  status: SeriesStatus;
  isLocal?: boolean;
}

export interface ReadingHistory {
  seriesId: string;
  chapterId: string;
  scrollPosition: number; // percentage 0-100
  lastRead: number; // timestamp
}

export interface Source {
  id: string;
  name: string;
  url: string;
  lastUpdated: number;
}

export interface AppState {
  sources: Source[];
  activeSeries: Series | null;
  history: Record<string, ReadingHistory>;
  readingTimeSeconds: number;
  favorites: string[]; // List of series IDs
}
