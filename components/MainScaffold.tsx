
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Library from './Library';
import SearchPage from './SearchPage';
import HistoryPage from './HistoryPage';
import SettingsPage from './SettingsPage';
import { Source, ReadingHistory, Series } from '../types';

interface MainScaffoldProps {
  sources: Source[];
  history: Record<string, ReadingHistory>;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onAddSource: (name: string, url: string) => void;
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  onImportLocal: (series: Series) => void;
  localSeries: Series[];
}

export type FilterType = 'tout' | 'derniers' | 'telecharges' | 'favoris';

const MainScaffold: React.FC<MainScaffoldProps> = ({ 
  sources, 
  history, 
  favorites, 
  onToggleFavorite, 
  onAddSource, 
  setSources, 
  onImportLocal,
  localSeries
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>('tout');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const getIndexFromPath = (path: string) => {
    if (path === '/search') return 1;
    if (path === '/history') return 2;
    if (path === '/settings') return 3;
    return 0; 
  };

  const [activeIndex, setActiveIndex] = useState(getIndexFromPath(location.pathname));

  useEffect(() => {
    setActiveIndex(getIndexFromPath(location.pathname));
  }, [location.pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabChange = (index: number) => {
    if (index === 0) navigate('/');
    else if (index === 1) navigate('/search');
    else if (index === 2) navigate('/history');
    else if (index === 3) navigate('/settings');
  };

  const filterLabels: Record<FilterType, string> = {
    tout: 'Tous les titres',
    derniers: 'Derniers lus',
    telecharges: 'Téléchargés',
    favoris: 'Mes favoris'
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#050810]">
      {/* Header - Pill Filter Version */}
      <header className="flex-shrink-0 bg-[#050810]/80 backdrop-blur-xl border-b border-white/5 h-20 flex items-center justify-between px-6 md:px-10 z-50">
        <div className="text-2xl font-black tracking-tighter bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent cursor-pointer" onClick={() => navigate('/')}>
          OMNI<span className="text-blue-500">READ</span>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 hover:bg-slate-800 border border-white/5 rounded-full transition-all active:scale-95 group"
          >
            <div className={`w-2 h-2 rounded-full transition-shadow duration-500 ${activeFilter === 'tout' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 group-hover:text-white transition-colors">
              {filterLabels[activeFilter]}
            </span>
            <svg className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Popup Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-[#0a0f1d] border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
              <div className="p-2 space-y-1">
                {(Object.keys(filterLabels) as FilterType[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveFilter(key);
                      setIsMenuOpen(false);
                      if (activeIndex !== 0) handleTabChange(0);
                    }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${activeFilter === key ? 'bg-white' : 'bg-slate-700'}`}></div>
                    {filterLabels[key]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeIndex === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <Library sources={sources} history={history} favorites={favorites} onToggleFavorite={onToggleFavorite} localSeries={localSeries} externalFilter={activeFilter} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeIndex === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <SearchPage sources={sources} favorites={favorites} onToggleFavorite={onToggleFavorite} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeIndex === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <HistoryPage history={history} sources={sources} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeIndex === 3 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <SettingsPage onAddSource={onAddSource} sources={sources} setSources={setSources} onImportLocal={onImportLocal} />
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="flex-shrink-0 bg-[#050810] border-t border-white/5 h-20 px-4 flex items-center justify-around z-50">
        <button 
          onClick={() => handleTabChange(0)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeIndex === 0 ? 'text-blue-500 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Bibliothèque</span>
        </button>

        <button 
          onClick={() => handleTabChange(1)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeIndex === 1 ? 'text-blue-500 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Recherche</span>
        </button>
        
        <button 
          onClick={() => handleTabChange(2)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeIndex === 2 ? 'text-blue-500 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Historique</span>
        </button>

        <button 
          onClick={() => handleTabChange(3)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeIndex === 3 ? 'text-blue-500 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Paramètres</span>
        </button>
      </nav>
    </div>
  );
};

export default MainScaffold;
