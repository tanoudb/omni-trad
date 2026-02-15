
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Series, Source, ReadingHistory, Category } from '../types';
import { fetchAllFromSources } from '../services/sourceService';

interface LibraryProps {
  sources: Source[];
  history: Record<string, ReadingHistory>;
  favorites: string[];
  onToggleFavorite: (seriesId: string) => void;
  localSeries: Series[];
  categories: Category[];
}

type SortMode = 'alpha' | 'chapters_asc' | 'chapters_desc';

const Library: React.FC<LibraryProps> = ({ sources, history, favorites, onToggleFavorite, localSeries, categories }) => {
  const [remoteItems, setRemoteItems] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id || 'default');
  const [sortMode, setSortMode] = useState<SortMode>('alpha');
  const [showSortMenu, setShowSortMenu] = useState(false);

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
    let list = [...localSeries, ...remoteItems];
    
    // Filtrage par catégorie
    list = list.filter(item => {
      if (activeCategoryId === 'default' && (!item.categories || item.categories.length === 0)) return true;
      return item.categories?.includes(activeCategoryId);
    });

    // Tri
    if (sortMode === 'alpha') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortMode === 'chapters_asc') {
      list.sort((a, b) => (a.chapters?.length || 0) - (b.chapters?.length || 0));
    } else if (sortMode === 'chapters_desc') {
      list.sort((a, b) => (b.chapters?.length || 0) - (a.chapters?.length || 0));
    }

    return list;
  }, [localSeries, remoteItems, activeCategoryId, sortMode]);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 bg-[#050810]">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="animate-pulse flex flex-col gap-2">
            <div className="aspect-[2/3] bg-slate-900/50 rounded-2xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-[#050810] flex flex-col relative">
      <header className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Bibliothèque</h2>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
            <button onClick={() => setShowSortMenu(!showSortMenu)} className={`p-2 ${showSortMenu ? 'text-[#8ab4f8]' : 'text-slate-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
            </button>
            <button className="p-2 text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto no-scrollbar border-b border-white/5 pb-2 px-2">
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`whitespace-nowrap pb-2 text-xs font-black uppercase tracking-[0.15em] transition-all border-b-2 ${activeCategoryId === cat.id ? 'text-[#8ab4f8] border-[#8ab4f8]' : 'text-slate-600 border-transparent hover:text-slate-400'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {showSortMenu && (
        <div className="absolute top-24 right-6 z-20 bg-[#1a1c22] border border-white/5 rounded-2xl p-2 shadow-2xl min-w-[200px] animate-in fade-in slide-in-from-top-2">
          <button onClick={() => { setSortMode('alpha'); setShowSortMenu(false); }} className={`w-full text-left p-3 text-[10px] font-black uppercase tracking-widest rounded-xl ${sortMode === 'alpha' ? 'text-[#8ab4f8] bg-[#8ab4f8]/10' : 'text-slate-400'}`}>Alphabétique</button>
          <button onClick={() => { setSortMode('chapters_desc'); setShowSortMenu(false); }} className={`w-full text-left p-3 text-[10px] font-black uppercase tracking-widest rounded-xl ${sortMode === 'chapters_desc' ? 'text-[#8ab4f8] bg-[#8ab4f8]/10' : 'text-slate-400'}`}>Le plus de chapitres</button>
          <button onClick={() => { setSortMode('chapters_asc'); setShowSortMenu(false); }} className={`w-full text-left p-3 text-[10px] font-black uppercase tracking-widest rounded-xl ${sortMode === 'chapters_asc' ? 'text-[#8ab4f8] bg-[#8ab4f8]/10' : 'text-slate-400'}`}>Le moins de chapitres</button>
        </div>
      )}

      {allItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-1000">
           <span className="text-6xl font-black text-slate-700 tracking-tighter mb-8 opacity-20 select-none">(⌣_⌣”)</span>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest max-w-[280px] leading-relaxed">
             Votre bibliothèque est vide. <br/> Ajoutez des mangas depuis l'onglet parcourir.
           </p>
           <Link to="/browse" className="mt-8 flex items-center gap-3 px-8 py-3 bg-[#8ab4f8]/10 text-[#8ab4f8] rounded-full font-black text-[10px] uppercase tracking-[0.2em] border border-[#8ab4f8]/20 hover:bg-[#8ab4f8] hover:text-white transition-all">
             Parcourir
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 p-4 gap-4">
           {allItems.map(series => {
             const firstChapterId = series.chapters?.[0]?.id;
             return (
               <Link key={series.id} to={`/reader/${series.id}/${firstChapterId}`} className="group space-y-2">
                 <div className="aspect-[2/3] bg-slate-900 rounded-2xl overflow-hidden shadow-xl group-hover:shadow-[#8ab4f8]/10 transition-all border border-white/5 relative">
                   <img src={series.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   {series.chapters && (
                     <div className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-tighter backdrop-blur-sm">
                       {series.chapters.length} CH.
                     </div>
                   )}
                 </div>
                 <div className="px-1">
                   <h3 className="text-[11px] font-bold text-slate-100 uppercase truncate leading-tight">{series.title}</h3>
                   <p className="text-[9px] font-bold text-slate-600 uppercase truncate tracking-wider mt-0.5">{series.isLocal ? 'IMPORT LOCAL' : series.author}</p>
                 </div>
               </Link>
             );
           })}
        </div>
      )}
    </div>
  );
};

export default Library;
