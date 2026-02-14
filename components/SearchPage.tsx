
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Series, Source } from '../types';
import { fetchAllFromSources } from '../services/sourceService';

interface SearchPageProps {
  sources: Source[];
  favorites: string[];
  onToggleFavorite: (seriesId: string) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({ sources, favorites, onToggleFavorite }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Series[]>([]);
  const [allItems, setAllItems] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      const data = await fetchAllFromSources(sources);
      setAllItems(data);
      setLoading(false);
    };
    loadItems();
  }, [sources]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const filtered = allItems.filter(s => 
      s.title.toLowerCase().includes(query.toLowerCase()) || 
      s.author.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }, [query, allItems]);

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10 space-y-10 pb-32 no-scrollbar">
      <div className="space-y-4">
        <h2 className="text-3xl font-black tracking-tighter uppercase">Recherche</h2>
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input 
            type="text" 
            placeholder="Titre, auteur, genre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-3xl py-5 pl-14 pr-6 text-sm font-bold focus:ring-2 ring-blue-500/50 outline-none transition-all placeholder:text-slate-600 shadow-2xl"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : query.trim() === '' ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-700">
           <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
           <p className="font-black uppercase tracking-[0.2em] text-[10px]">Entrez un titre pour explorer le catalogue</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Aucun résultat pour "{query}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {results.map(series => {
            const isFavorite = favorites.includes(series.id);
            return (
              <div key={series.id} className="flex flex-col group animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="relative aspect-[2/3] overflow-hidden rounded-3xl shadow-2xl transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2">
                  <Link to={`/reader/${series.id}/${series.chapters[0].id}`}>
                    <img src={series.coverUrl} className="w-full h-full object-cover" alt={series.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                  </Link>
                  <button 
                    onClick={() => onToggleFavorite(series.id)}
                    className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-black/30 text-white opacity-0 group-hover:opacity-100'}`}
                  >
                    <svg className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </button>
                </div>
                <div className="mt-4 px-1">
                  <h3 className="font-black text-xs truncate uppercase tracking-tight group-hover:text-blue-400 transition-colors">{series.title}</h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{series.author}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
