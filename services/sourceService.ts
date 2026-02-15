
import { Series, Source } from '../types';

/**
 * Récupère toutes les séries depuis les sources JSON configurées.
 */
export const fetchAllFromSources = async (sources: Source[]): Promise<Series[]> => {
  if (!sources || sources.length === 0) return [];

  const allSeries: Series[] = [];
  
  for (const source of sources) {
    try {
      // On évite de fetch la source de démo par défaut si elle n'existe plus
      if (source.id === 'default' && source.url.includes('githubusercontent')) continue;

      const response = await fetch(source.url);
      if (!response.ok) continue;
      
      const data = await response.json();
      
      // Support de différents formats de JSON (Array direct ou objet avec propriété 'series')
      const seriesList = Array.isArray(data) ? data : (data.series || []);
      
      if (Array.isArray(seriesList)) {
        allSeries.push(...seriesList.map((s: any) => ({
          ...s,
          sourceId: source.id
        })));
      }
    } catch (e) {
      console.error(`[SOURCE] Échec du chargement : ${source.name}`, e);
    }
  }

  return allSeries;
};

/**
 * Récupère les détails d'une série spécifique (Locale ou Distante).
 */
export const fetchMockSeriesData = async (seriesId: string): Promise<Series> => {
    // 1. Vérification dans les items locaux
    const savedLocals = localStorage.getItem('omni_local_items');
    const locals: Series[] = savedLocals ? JSON.parse(savedLocals) : [];
    const localFound = locals.find(s => s.id === seriesId);
    if (localFound) return localFound;

    // 2. Vérification dans les sources distantes configurées
    const savedSources = localStorage.getItem('omni_sources');
    const sources: Source[] = savedSources ? JSON.parse(savedSources) : [];
    const allRemote = await fetchAllFromSources(sources);
    const remoteFound = allRemote.find(s => s.id === seriesId);
    
    if (!remoteFound) throw new Error("Série introuvable ou source inaccessible");
    return remoteFound;
};
