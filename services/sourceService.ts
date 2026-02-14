
import { Series, Source } from '../types';

/**
 * Fetches all series from the provided sources.
 */
export const fetchAllFromSources = async (sources: Source[]): Promise<Series[]> => {
  // Simulated delay
  await new Promise(r => setTimeout(r, 600));

  const demoData: Series[] = [
    {
      id: 'ser-1',
      title: 'Solitary Necromancer',
      author: 'Author A',
      status: 'en_cours',
      description: 'A thrilling story about a lone necromancer.',
      coverUrl: 'https://picsum.photos/seed/manga1/400/600',
      chapters: [
        { 
          id: 'ch-1', 
          number: 1, 
          title: 'Prologue: The Awakening', 
          pages: [
            'https://picsum.photos/seed/page1/800/1200',
            'https://picsum.photos/seed/page2/800/1200',
            'https://picsum.photos/seed/page3/800/1200',
            'https://picsum.photos/seed/page4/800/1200'
          ] 
        },
        { 
          id: 'ch-2', 
          number: 2, 
          title: 'The Hidden Dungeon', 
          pages: [
            'https://picsum.photos/seed/page5/800/1200',
            'https://picsum.photos/seed/page6/800/1200'
          ] 
        }
      ]
    },
    {
      id: 'ser-2',
      title: 'The Max Level Hero Returns',
      author: 'Author B',
      status: 'termine',
      description: 'A hero returns with max levels.',
      coverUrl: 'https://picsum.photos/seed/manga2/400/600',
      chapters: [
        { id: 'ch-101', number: 1, title: 'Chapter 1: Regret', pages: ['https://picsum.photos/seed/page7/800/1200'] }
      ]
    },
    {
        id: 'ser-3',
        title: 'Leveling Up with the Gods',
        author: 'Author C',
        status: 'en_cours',
        description: 'Climbing the tower with ancient gods.',
        coverUrl: 'https://picsum.photos/seed/manga3/400/600',
        chapters: [
          { id: 'ch-201', number: 1, title: 'Chapter 1: The Tower', pages: ['https://picsum.photos/seed/page8/800/1200'] }
        ]
    }
  ];

  return demoData;
};

export const fetchMockSeriesData = async (seriesId: string): Promise<Series> => {
    // Si c'est un item local, on le récupère dans le localStorage
    if (seriesId.startsWith('local-')) {
      const saved = localStorage.getItem('omni_local_items');
      const locals: Series[] = saved ? JSON.parse(saved) : [];
      const found = locals.find(s => s.id === seriesId);
      if (found) return found;
    }

    const all = await fetchAllFromSources([]);
    const found = all.find(s => s.id === seriesId);
    if (!found) throw new Error("Series not found");
    return found;
};
