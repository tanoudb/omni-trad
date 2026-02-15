
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chapter, Series, ReadingHistory } from '../types';
import { fetchMockSeriesData } from '../services/sourceService';
import { syncReadingProgress } from '../services/supabaseService';
import { getOfflineChapter } from '../services/downloadService';

interface VerticalReaderProps {
  onProgress: (seriesId: string, chapterId: string, scrollPosition: number) => void;
}

interface LoadedChapter {
  id: string;
  number: number;
  title: string;
  pages: string[];
}

const VerticalReader: React.FC<VerticalReaderProps> = ({ onProgress }) => {
  const { seriesId, chapterId } = useParams<{ seriesId: string; chapterId: string }>();
  const navigate = useNavigate();
  
  const [series, setSeries] = useState<Series | null>(null);
  const [loadedChapters, setLoadedChapters] = useState<LoadedChapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isUIVisible, setIsUIVisible] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [displayPercent, setDisplayPercent] = useState(0);
  const isInitialScrollDone = useRef(false);

  const currentProgressRef = useRef({ seriesId, chapterId: activeChapterId, percent: displayPercent });
  useEffect(() => {
    currentProgressRef.current = { seriesId, chapterId: activeChapterId, percent: displayPercent };
  }, [seriesId, activeChapterId, displayPercent]);

  const saveProgress = useCallback(() => {
    const { seriesId: sId, chapterId: cId, percent } = currentProgressRef.current;
    if (!sId || !cId) return;

    const historyData: ReadingHistory = {
      seriesId: sId,
      chapterId: cId,
      scrollPosition: percent,
      lastRead: Date.now()
    };
    syncReadingProgress(historyData);
    onProgress(sId, cId, percent);
  }, [onProgress]);

  useEffect(() => {
    const syncInterval = setInterval(saveProgress, 3000);
    return () => {
      clearInterval(syncInterval);
      saveProgress();
    };
  }, [saveProgress]);

  const loadChapter = useCallback(async (chapter: Chapter) => {
    if (!seriesId) return;
    try {
      let pages = await getOfflineChapter(seriesId, chapter.id);
      if (!pages || pages.length === 0) {
        pages = chapter.pages;
      }
      
      if (!pages || pages.length === 0) return;

      const newChapter: LoadedChapter = {
        id: chapter.id,
        number: chapter.number,
        title: chapter.title,
        pages
      };
      
      setLoadedChapters(prev => {
        if (prev.some(c => c.id === chapter.id)) return prev;
        return [...prev, newChapter].sort((a, b) => a.number - b.number);
      });
    } catch (err: any) {
      console.error(`Erreur chargement chapitre : ${err.message}`);
    }
  }, [seriesId]);

  const restoreScrollPosition = useCallback(() => {
    if (!scrollContainerRef.current || isInitialScrollDone.current || loadedChapters.length === 0) return;
    const savedHistory = localStorage.getItem('omni_history');
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      const record = history[seriesId!];
      if (record && record.chapterId === activeChapterId) {
        const targetChapterEl = chapterRefs.current[activeChapterId];
        if (targetChapterEl && scrollContainerRef.current) {
          const chapterTop = targetChapterEl.offsetTop;
          const chapterHeight = targetChapterEl.scrollHeight;
          const targetScroll = chapterTop + (record.scrollPosition / 100) * (chapterHeight - scrollContainerRef.current.clientHeight);
          scrollContainerRef.current.scrollTo({ top: targetScroll, behavior: 'auto' });
          isInitialScrollDone.current = true;
        }
      }
    }
  }, [seriesId, activeChapterId, loadedChapters.length]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (!seriesId || !chapterId) return;
      setLoading(true);
      setErrorStatus(null);
      setLoadedChapters([]);
      isInitialScrollDone.current = false;

      try {
        const data = await fetchMockSeriesData(seriesId);
        if (!isMounted) return;
        setSeries(data);
        const startChapter = (data.chapters || []).find(c => c.id === chapterId);
        if (startChapter) {
          let pages = await getOfflineChapter(seriesId, startChapter.id);
          if (!pages || pages.length === 0) pages = startChapter.pages;
          
          if (pages && pages.length > 0) {
            if (isMounted) {
              setLoadedChapters([{
                id: startChapter.id,
                number: startChapter.number,
                title: startChapter.title,
                pages
              }]);
              setActiveChapterId(startChapter.id);
              setLoading(false);
            }
          } else {
            setErrorStatus("Chapitre vide.");
          }
        } else {
          setErrorStatus("Chapitre introuvable.");
        }
      } catch (e) {
        console.error("Init reader error:", e);
        setErrorStatus("Impossible de charger le manga.");
      } finally {
        if (isMounted && errorStatus) setLoading(false);
      }
    };
    init();
    return () => { isMounted = false; };
  }, [seriesId, chapterId, errorStatus]);

  useEffect(() => {
    if (!loading && loadedChapters.length > 0) {
      const timer = setTimeout(restoreScrollPosition, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, loadedChapters, restoreScrollPosition]);

  const handleScroll = () => {
    if (!scrollContainerRef.current || !series || loadedChapters.length === 0) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    let currentActiveId = activeChapterId;
    let minDiff = Infinity;

    Object.entries(chapterRefs.current).forEach(([id, el]) => {
      const element = el as HTMLDivElement | null;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const diff = Math.abs(rect.top);
      if (diff < minDiff) {
        minDiff = diff;
        currentActiveId = id;
      }
    });

    if (currentActiveId && currentActiveId !== activeChapterId) {
      setActiveChapterId(currentActiveId);
    }

    const activeEl = chapterRefs.current[currentActiveId!];
    if (activeEl) {
      const chapterTop = activeEl.offsetTop;
      const chapterHeight = activeEl.scrollHeight;
      const relativeScroll = scrollTop - chapterTop;
      const maxScroll = chapterHeight - clientHeight;
      const progress = Math.max(0, Math.min(100, (relativeScroll / (maxScroll || 1)) * 100));
      setDisplayPercent(progress);
    }

    if (isUIVisible) setIsUIVisible(false);

    if (scrollTop + clientHeight > scrollHeight - 3000 && series.chapters) {
      const lastLoaded = loadedChapters[loadedChapters.length - 1];
      const idx = series.chapters.findIndex(c => c.id === lastLoaded.id);
      if (idx !== -1 && idx < series.chapters.length - 1) {
        loadChapter(series.chapters[idx + 1]);
      }
    }
  };

  const seekTo = (percent: number) => {
    if (!scrollContainerRef.current || !activeChapterId) return;
    const activeEl = chapterRefs.current[activeChapterId];
    if (!activeEl) return;

    const chapterTop = activeEl.offsetTop;
    const chapterHeight = activeEl.scrollHeight;
    const targetInChapter = (percent / 100) * (chapterHeight - scrollContainerRef.current.clientHeight);
    
    scrollContainerRef.current.scrollTo({ 
      top: chapterTop + targetInChapter, 
      behavior: 'instant' 
    });
    setDisplayPercent(percent);
  };

  const navigateToChapter = (direction: 'next' | 'prev') => {
    if (!series || !series.chapters || !activeChapterId) return;
    const currentIdx = series.chapters.findIndex(c => c.id === activeChapterId);
    const targetIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    
    if (targetIdx >= 0 && targetIdx < series.chapters.length) {
      navigate(`/reader/${seriesId}/${series.chapters[targetIdx].id}`, { replace: true });
    } else if (direction === 'next') {
      navigate('/');
    }
  };

  const activeChapterInfo = useMemo(() => {
    return series?.chapters?.find(c => c.id === activeChapterId);
  }, [series, activeChapterId]);

  const isAtEndOfSeries = series && series.chapters && loadedChapters.some(c => c.id === series.chapters![series.chapters!.length - 1]?.id);

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="w-10 h-10 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#8ab4f8]">Chargement</p>
    </div>
  );

  if (errorStatus) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center p-10 text-center">
       <h2 className="text-xl font-black uppercase text-white mb-2 tracking-tighter">Erreur</h2>
       <p className="text-slate-500 text-xs mb-8 uppercase tracking-widest">{errorStatus}</p>
       <button onClick={() => navigate(-1)} className="px-10 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Retour</button>
    </div>
  );

  return (
    <div className="h-screen w-full bg-black overflow-hidden flex flex-col relative select-none">
      <div className={`fixed top-0 left-0 w-full z-50 p-6 flex items-center justify-between bg-gradient-to-b from-black/95 via-black/40 to-transparent transition-all duration-500 ease-in-out ${isUIVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(-1); }} 
          className="p-4 bg-white/5 rounded-2xl text-white backdrop-blur-3xl border border-white/10 active:scale-90 transition-all shadow-2xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center px-4">
          <h2 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#8ab4f8] line-clamp-1 mb-0.5">{series?.title}</h2>
          <p className="text-sm font-black text-white uppercase tracking-tight">
            {activeChapterInfo ? `Chapitre ${activeChapterInfo.number}` : '...'}
          </p>
        </div>
        <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 text-[10px] font-black text-white backdrop-blur-xl">
          {Math.round(displayPercent)}%
        </div>
      </div>

      <div 
        ref={scrollContainerRef} 
        onScroll={handleScroll} 
        onClick={() => setIsUIVisible(!isUIVisible)}
        className="flex-1 overflow-y-auto no-scrollbar bg-black scroll-smooth cursor-pointer"
      >
        <div className="flex flex-col w-full">
          {loadedChapters.map((chapter, cIdx) => (
            <div 
              key={chapter.id} 
              ref={el => chapterRefs.current[chapter.id] = el}
              className="flex flex-col w-full"
            >
              {cIdx > 0 && (
                <div className="py-20 flex flex-col items-center justify-center bg-[#0a0f1d] border-y border-white/5">
                   <div className="w-1 h-12 bg-[#8ab4f8]/20 mb-6"></div>
                   <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#8ab4f8]">Chapitre {chapter.number}</p>
                   <p className="text-lg font-black text-white uppercase tracking-tighter mt-1">{chapter.title}</p>
                </div>
              )}

              {chapter.pages.map((url, pIdx) => (
                <div key={`${chapter.id}-p${pIdx}`} className="relative w-full bg-slate-950/20 min-h-[300px]">
                  {!failedImages.has(url) ? (
                    <img 
                      src={url} 
                      className="w-full h-auto block m-0 p-0 pointer-events-none"
                      alt=""
                      loading={pIdx < 4 && cIdx === 0 ? "eager" : "lazy"}
                      onError={() => setFailedImages(prev => new Set(prev).add(url))}
                    />
                  ) : (
                    <div className="w-full py-40 flex flex-col items-center justify-center bg-red-950/5 border-y border-red-500/10">
                       <p className="text-red-500/40 text-[9px] font-black uppercase tracking-[0.4em]">Image Indisponible</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          <div className="py-32 flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-slate-900/10">
             <div className="h-px w-24 bg-slate-800/50 mb-10"></div>
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 mb-12">
               {isAtEndOfSeries ? "Fin de la série" : "Chargement..."}
             </p>
             
             {isAtEndOfSeries ? (
               <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/'); }}
                  className="px-16 py-6 bg-slate-900 border border-white/10 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 active:scale-95 transition-all shadow-2xl"
               >
                 Retour Accueil
               </button>
             ) : (
               <button 
                  onClick={(e) => { e.stopPropagation(); navigateToChapter('next'); }}
                  className="px-16 py-6 bg-[#8ab4f8] text-[#050810] rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-900/30"
               >
                 Suivant
               </button>
             )}
          </div>
        </div>
      </div>

      <div className={`fixed bottom-0 left-0 w-full z-50 px-8 pb-12 pt-24 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-all duration-500 ease-in-out ${isUIVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-end px-2">
            <button 
              onClick={(e) => { e.stopPropagation(); navigateToChapter('prev'); }}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
              Précédent
            </button>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 mb-1">
                Progression
              </p>
              <p className="text-xl font-black text-[#8ab4f8] tracking-tighter leading-none">{Math.round(displayPercent)}%</p>
            </div>
          </div>
          
          <div className="relative group/seek h-10 flex items-center">
            <div className="absolute w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-to-r from-blue-600 to-[#8ab4f8] shadow-[0_0_20px_rgba(138,180,248,0.6)]" style={{ width: `${displayPercent}%` }}></div>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="0.1"
              value={displayPercent}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              className="absolute w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
              className="absolute w-5 h-5 bg-white rounded-full border-4 border-blue-600 transition-transform group-hover/seek:scale-125 pointer-events-none shadow-2xl"
              style={{ left: `calc(${displayPercent}% - 10px)` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerticalReader;
