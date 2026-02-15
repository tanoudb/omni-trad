
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import Library from './Library';
import HistoryPage from './HistoryPage';
import SettingsPage from './SettingsPage';
import BrowsePage from './BrowsePage';
import { Source, ReadingHistory, Series, Category } from '../types';

interface MainScaffoldProps {
  sources: Source[];
  history: Record<string, ReadingHistory>;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onAddSource: (name: string, url: string, categories?: string[]) => void;
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  onImportLocal: (series: Series) => void;
  localSeries: Series[];
}

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('omni_categories');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Ma bibliothèque' }];
  });

  useEffect(() => {
    localStorage.setItem('omni_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setActiveIndex(0);
    else if (path === '/browse') setActiveIndex(1);
    else if (path === '/history') setActiveIndex(2);
    else if (path.startsWith('/settings')) setActiveIndex(3);
  }, [location.pathname]);

  const handleTabChange = (index: number) => {
    const paths = ['/', '/browse', '/history', '/settings'];
    navigate(paths[index]);
  };

  const isSettingsSubpage = location.pathname.startsWith('/settings/');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#050810] text-[#f8fafc]">
      <main className="flex-1 relative overflow-hidden">
        {isSettingsSubpage ? (
          <Outlet />
        ) : (
          <>
            <div className={`absolute inset-0 transition-opacity duration-200 ${activeIndex === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <Library 
                sources={sources} 
                history={history} 
                favorites={favorites} 
                onToggleFavorite={onToggleFavorite} 
                localSeries={localSeries} 
                categories={categories}
              />
            </div>
            <div className={`absolute inset-0 transition-opacity duration-200 ${activeIndex === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <BrowsePage 
                sources={sources} 
                onAddSource={onAddSource} 
                setSources={setSources} 
                onImportLocal={onImportLocal} 
                categories={categories}
              />
            </div>
            <div className={`absolute inset-0 transition-opacity duration-200 ${activeIndex === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <HistoryPage history={history} sources={sources} localSeries={localSeries} />
            </div>
            <div className={`absolute inset-0 transition-opacity duration-200 ${activeIndex === 3 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <SettingsPage 
                onAddSource={onAddSource} 
                sources={sources} 
                setSources={setSources} 
                onImportLocal={onImportLocal} 
              />
            </div>
          </>
        )}
      </main>

      {!isSettingsSubpage && (
        <nav className="flex-shrink-0 bg-[#0d1117] border-t border-white/5 h-[84px] px-2 flex items-center justify-around z-50">
          {[
            { label: 'Bibliothèque', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
            { label: 'Parcourir', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg> },
            { label: 'Historique', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            { label: 'Plus', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={() => handleTabChange(idx)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${activeIndex === idx ? 'text-[#8ab4f8]' : 'text-[#9ca3af] hover:text-[#d1d5db]'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${activeIndex === idx ? 'bg-[#8ab4f8]/10' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-bold ${activeIndex === idx ? 'opacity-100' : 'opacity-80'}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default MainScaffold;
