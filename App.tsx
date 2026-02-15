
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Source, ReadingHistory, Series } from './types';
import VerticalReader from './components/VerticalReader';
import MainScaffold from './components/MainScaffold';
import LibrarySettings from './components/settings/LibrarySettings';
import Onboarding from './components/Onboarding';

const App: React.FC = () => {
  const [sources, setSources] = useState<Source[]>(() => {
    const saved = localStorage.getItem('omni_sources');
    return saved ? JSON.parse(saved) : [];
  });

  const [localSeries, setLocalSeries] = useState<Series[]>(() => {
    const saved = localStorage.getItem('omni_local_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState<Record<string, ReadingHistory>>(() => {
    const saved = localStorage.getItem('omni_history');
    return saved ? JSON.parse(saved) : {};
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('omni_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('omni_profile');
  });

  useEffect(() => {
    localStorage.setItem('omni_sources', JSON.stringify(sources));
  }, [sources]);

  useEffect(() => {
    localStorage.setItem('omni_local_items', JSON.stringify(localSeries));
  }, [localSeries]);

  useEffect(() => {
    localStorage.setItem('omni_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('omni_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const updateHistory = (seriesId: string, chapterId: string, scrollPosition: number) => {
    setHistory(prev => ({
      ...prev,
      [seriesId]: {
        seriesId,
        chapterId,
        scrollPosition,
        lastRead: Date.now()
      }
    }));
  };

  const toggleFavorite = (seriesId: string) => {
    setFavorites(prev => 
      prev.includes(seriesId) 
        ? prev.filter(id => id !== seriesId) 
        : [...prev, seriesId]
    );
  };

  const addSource = (name: string, url: string) => {
    const id = btoa(url).substring(0, 8);
    if (!sources.find(s => s.id === id)) {
      setSources(prev => [...prev, {
        id,
        name,
        url,
        lastUpdated: Date.now()
      }]);
    }
  };

  const handleImportLocal = (series: Series) => {
    const metaSeries = { 
      ...series, 
      chapters: (series.chapters || []).map(c => ({ ...c, pages: [] })) 
    };
    setLocalSeries(prev => [metaSeries, ...prev]);
  };

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#050810] text-slate-100 flex flex-col font-sans selection:bg-[#8ab4f8]/30">
        <Routes>
          <Route element={<MainScaffold 
            sources={sources} 
            setSources={setSources}
            history={history} 
            favorites={favorites} 
            onToggleFavorite={toggleFavorite} 
            onAddSource={addSource}
            onImportLocal={handleImportLocal}
            localSeries={localSeries}
          />}>
            <Route path="/" element={<div />} />
            <Route path="/browse" element={<div />} />
            <Route path="/history" element={<div />} />
            <Route path="/settings" element={<div />} />
            <Route path="/settings/library" element={<LibrarySettings />} />
          </Route>
          <Route path="/reader/:seriesId/:chapterId" element={<VerticalReader onProgress={updateHistory} />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
