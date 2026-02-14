
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Series, Source, ReadingHistory } from '../types';
import { fetchAllFromSources } from '../services/sourceService';
import { saveChapterOffline } from '../services/downloadService';
import { FilterType } from './MainScaffold';

interface LibraryProps {
  sources: Source[];
  history: Record<string, ReadingHistory>;
  favorites: string[];
  onToggleFavorite: (seriesId: string) => void;
  localSeries: Series[];
  externalFilter?: FilterType;
}

const Library: React.FC<LibraryProps> = ({ sources, history, favorites, onToggleFavorite, localSeries, externalFilter = 'tout' }) => {
  const [remoteItems, setRemoteItems] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const loadRemote = async () => {
      setLoading(true);
      try {
        const remoteData = await fetchAllFromSources(sources);
        setRemoteItems(remoteData);
      } catch (err) {
        console.error("Library remote load error", err);
      } finally {
        setLoading(false);
      }
    };
    loadRemote();
  }, [sources]);

  const allItems = useMemo(() => {
    return [...localSeries, ...remoteItems];
  }, [localSeries, remoteItems]);

  const filteredItems = useMemo(() => {
    let result = [...allItems];

    if (externalFilter === 'favoris') {
      result = result.filter(s => favorites.includes(s.id));
    } else if (externalFilter === 'telecharges') {
      result = result.filter(s => s.isLocal);
    } else if (externalFilter === 'derniers') {
      result = result
        .filter(s => history[s.id])
        .sort((a, b) => (history[b.id]?.lastRead || 0) - (history[a.id]?.lastRead || 0));
    }

    return result;
  }, [allItems, externalFilter, favorites, history]);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="animate-pulse flex flex-col gap-2">
            <div className="aspect-[2/3] bg-slate-800 rounded-3xl"></div>
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 md:p-10 space-y-10 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Bibliothèque</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">{filteredItems.length} titres disponibles</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
        {filteredItems.map(series => {
          const isFavorite = favorites.includes(series.id);
          const isLocal = series.isLocal;
          const lastProgress = history[series.id]?.scrollPosition || 0;

          return (
            <div key={series.id} className="flex flex-col group relative animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="relative aspect-[2/3] overflow-hidden rounded-[2rem] shadow-2xl transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2 group-hover:shadow-blue-500/20">
                <Link to={`/reader/${series.id}/${series.chapters[0].id}`}>
                  <img src={series.coverUrl} className="w-full h-full object-cover" alt={series.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity"></div>
                </Link>
                
                {isLocal && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-xl">
                    Local
                  </div>
                )}

                {lastProgress > 0 && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
                    <div className="h-full bg-blue-500" style={{ width: `${lastProgress}%` }}></div>
                  </div>
                )}

                <button 
                  onClick={(e) => { e.preventDefault(); onToggleFavorite(series.id); }}
                  className={`absolute top-4 right-4 p-2.5 rounded-xl backdrop-blur-md transition-all active:scale-90 ${isFavorite ? 'bg-red-500 text-white shadow-xl shadow-red-500/30' : 'bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:bg-black/50'}`}
                >
                  <svg className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
              </div>
              
              <div className="mt-5 px-2">
                <h3 className="font-black text-xs group-hover:text-blue-400 transition-colors line-clamp-1 uppercase tracking-tight">{series.title}</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{series.author}</p>
              </div>
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <div className="col-span-full py-40 text-center flex flex-col items-center gap-4 opacity-30">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-[10px] font-black uppercase tracking-widest">Aucun contenu dans cette catégorie</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
