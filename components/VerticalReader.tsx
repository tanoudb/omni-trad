
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chapter, Series } from '../types';
import { fetchMockSeriesData } from '../services/sourceService';
import { syncReadingProgress } from '../services/supabaseService';
import { getOfflineChapter } from '../services/downloadService';

interface VerticalReaderProps {
  onProgress: (seriesId: string, chapterId: string, scrollPosition: number) => void;
}

interface LoadedPage {
  chapterId: string;
  chapterNumber: number;
  url: string;
  index: number;
}

/**
 * Composant pour simuler l'InteractiveViewer de Flutter (Zoom sur image).
 */
const ZoomableImage: React.FC<{ url: string }> = ({ url }) => {
  const [scale, setScale] = useState(1);
  const [isZooming, setIsZooming] = useState(false);

  // Pour le web, on utilise le double-clic pour zoomer/dézoomer
  const handleDoubleClick = () => {
    setScale(scale === 1 ? 2.5 : 1);
    setIsZooming(scale === 1);
  };

  return (
    <div 
      className="w-full overflow-hidden touch-none"
      onDoubleClick={handleDoubleClick}
    >
      <img 
        src={url} 
        alt="" 
        loading="lazy"
        className={`w-full block h-auto transition-transform duration-300 origin-center ${isZooming ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
        style={{ transform: `scale(${scale})` }}
      />
    </div>
  );
};

const VerticalReader: React.FC<VerticalReaderProps> = ({ onProgress }) => {
  const { seriesId, chapterId } = useParams<{ seriesId: string; chapterId: string }>();
  const navigate = useNavigate();
  
  const [series, setSeries] = useState<Series | null>(null);
  const [allPages, setAllPages] = useState<LoadedPage[]>([]);
  const [loadedChapterIds, setLoadedChapterIds] = useState<Set<string>>(new Set());
  const [currentChapter, setCurrentChapter] = useState<{id: string, number: number} | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [brightness, setBrightness] = useState(100);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSyncProgress = useRef({ chapterId: '', scrollPosition: 0 });

  // Sync Logic
  const performSync = useCallback(() => {
    if (!seriesId || !currentChapter) return;
    
    const scrollTop = scrollRef.current?.scrollTop || 0;
    const scrollHeight = scrollRef.current?.scrollHeight || 1;
    const clientHeight = scrollRef.current?.clientHeight || 0;
    const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;

    if (lastSyncProgress.current.chapterId !== currentChapter.id || 
        Math.abs(lastSyncProgress.current.scrollPosition - scrollPercent) > 1) {
      
      const historyUpdate = {
        seriesId,
        chapterId: currentChapter.id,
        scrollPosition: scrollPercent,
        lastRead: Date.now()
      };
      
      syncReadingProgress(historyUpdate);
      onProgress(seriesId, currentChapter.id, scrollPercent);
      lastSyncProgress.current = { chapterId: currentChapter.id, scrollPosition: scrollPercent };
    }
  }, [seriesId, currentChapter, onProgress]);

  useEffect(() => {
    progressTimerRef.current = setInterval(performSync, 30000);
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      performSync();
    };
  }, [performSync]);

  // Infinite Scroll logic
  const loadNextChapter = useCallback(async () => {
    if (!series || loadingNext) return;
    
    const lastId = Array.from(loadedChapterIds).pop();
    const lastLoadedChapter = series.chapters.find(c => c.id === lastId);
    if (!lastLoadedChapter) return;

    const nextChapter = series.chapters.find(c => c.number === lastLoadedChapter.number + 1);
    if (!nextChapter) return;

    setLoadingNext(true);
    try {
      const offlinePages = await getOfflineChapter(series.id, nextChapter.id);
      const pagesToLoad = (offlinePages || nextChapter.pages).map((url, index) => ({
        chapterId: nextChapter.id,
        chapterNumber: nextChapter.number,
        url,
        index
      }));

      setAllPages(prev => [...prev, ...pagesToLoad]);
      setLoadedChapterIds(prev => new Set([...prev, nextChapter.id]));
    } finally {
      setLoadingNext(false);
    }
  }, [series, loadedChapterIds, loadingNext]);

  // Initial Load
  useEffect(() => {
    const loadInitial = async () => {
      if (!seriesId || !chapterId) return;
      setLoading(true);
      try {
        const data = await fetchMockSeriesData(seriesId);
        setSeries(data);
        const startChapter = data.chapters.find(c => c.id === chapterId);
        
        if (startChapter) {
          const offlinePages = await getOfflineChapter(seriesId, chapterId);
          const initialPages = (offlinePages || startChapter.pages).map((url, index) => ({
            chapterId: startChapter.id,
            chapterNumber: startChapter.number,
            url,
            index
          }));
          
          setAllPages(initialPages);
          setLoadedChapterIds(new Set([startChapter.id]));
          setCurrentChapter({ id: startChapter.id, number: startChapter.number });
        }
      } catch (error) {
        console.error("Failed to load series", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, [seriesId, chapterId]);

  const handleScroll = () => {
    if (!scrollRef.current || loadingNext) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 2500) {
      loadNextChapter();
    }
  };

  // Intersection Observer pour les titres de chapitres
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const cid = entry.target.getAttribute('data-chapter-id');
            const cnum = entry.target.getAttribute('data-chapter-num');
            if (cid && cnum) {
              setCurrentChapter({ id: cid, number: parseInt(cnum) });
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    const markers = document.querySelectorAll('.chapter-marker');
    markers.forEach(m => observer.observe(m));
    return () => observer.disconnect();
  }, [allPages]);

  const toggleControls = (e: React.MouseEvent) => {
    // Évite de basculer si on double-clique pour le zoom
    if (e.detail === 2) return;
    setShowControls(!showControls);
  };

  const isAtEnd = series && currentChapter && !series.chapters.find(c => c.number === currentChapter.number + 1);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#050810]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-black tracking-widest text-[10px] uppercase">Chargement du contenu...</p>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-black overflow-hidden select-none">
      {/* AppBar (Overlay Top) */}
      <div className={`fixed top-0 left-0 right-0 z-[60] bg-gradient-to-b from-black/90 to-transparent p-6 flex items-center gap-6 transition-all duration-500 ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <button onClick={() => navigate('/')} className="p-2 text-white hover:bg-white/10 rounded-full transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-white uppercase truncate tracking-tight">{series?.title}</h2>
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Chapitre {currentChapter?.number}</p>
        </div>
      </div>

      {/* Bottom Controls (Brightness & Progress) */}
      <div className={`fixed bottom-0 left-0 right-0 z-[60] bg-gradient-to-t from-black/95 via-black/80 to-transparent p-10 transition-all duration-500 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="max-w-2xl mx-auto space-y-6">
           <div className="flex items-center gap-4">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" /></svg>
              <input 
                type="range" min="20" max="100" 
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="flex-1 h-1 bg-white/10 rounded-full appearance-none accent-blue-500" 
              />
           </div>
           <div className="text-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Lecture Continue active</span>
           </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        onClick={toggleControls}
        className="h-full overflow-y-auto no-scrollbar scroll-smooth"
        style={{ filter: `brightness(${brightness}%)` }}
      >
        <div className="flex flex-col w-full">
          {allPages.map((page, pIdx) => {
            const isNewChapter = page.index === 0 && pIdx > 0;
            const prevPage = pIdx > 0 ? allPages[pIdx - 1] : null;

            return (
              <React.Fragment key={`${page.chapterId}-p-${page.index}`}>
                {/* Séparateur de Chapitre */}
                {isNewChapter && (
                  <div className="w-full bg-black py-12 flex flex-col items-center justify-center border-y border-white/5 space-y-3">
                     <div className="h-px w-12 bg-blue-500/50"></div>
                     <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] px-10 text-center leading-relaxed">
                       Fin du Chapitre {prevPage?.chapterNumber} <br/>
                       <span className="text-blue-500 inline-block mt-2">•</span><br/>
                       Début du Chapitre {page.chapterNumber}
                     </p>
                     <div className="h-px w-12 bg-blue-500/50"></div>
                  </div>
                )}

                {/* Page avec Zoom */}
                <div 
                  className={`w-full bg-black relative ${page.index === 0 ? 'chapter-marker' : ''}`}
                  data-chapter-id={page.chapterId}
                  data-chapter-num={page.chapterNumber}
                >
                  <ZoomableImage url={page.url} />
                </div>
              </React.Fragment>
            );
          })}

          {/* Loading Next */}
          {loadingNext && (
            <div className="w-full py-24 bg-black flex flex-col items-center gap-4">
               <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Indexation du chapitre suivant...</p>
            </div>
          )}

          {/* End Of Content */}
          {isAtEnd && !loadingNext && (
            <div className="w-full bg-[#050810] py-32 flex flex-col items-center text-center px-6">
               <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">Fin de lecture</h3>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest max-w-xs leading-loose">
                  Vous avez rattrapé la publication.<br/>
                  Plus de chapitres seront bientôt disponibles.
               </p>
               <button 
                onClick={() => navigate('/')}
                className="mt-12 px-12 py-5 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10"
               >
                 Retour au catalogue
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerticalReader;
