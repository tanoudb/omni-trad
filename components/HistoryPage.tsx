
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ReadingHistory, Source, Series } from '../types';
import { fetchAllFromSources } from '../services/sourceService';

interface HistoryPageProps {
  history: Record<string, ReadingHistory>;
  sources: Source[];
  localSeries: Series[];
}

const HistoryPage: React.FC<HistoryPageProps> = ({ history, sources, localSeries }) => {
  const [items, setItems] = useState<(ReadingHistory & { series: Series })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        // On récupère d'abord ce qu'on a en local pour afficher quelque chose rapidement
        const remoteSeries = await fetchAllFromSources(sources).catch(() => []);
        if (!isMounted) return;

        const allAvailableSeries = [...localSeries, ...remoteSeries];
        const historyEntries = Object.values(history) as ReadingHistory[];

        const historyList = historyEntries
          .map(h => {
            const series = allAvailableSeries.find(s => s.id === h.seriesId);
            if (!series) return null;
            return { ...h, series };
          })
          .filter((h): h is (ReadingHistory & { series: Series }) => h !== null)
          .sort((a, b) => b.lastRead - a.lastRead);
        
        setItems(historyList);
      } catch (err) {
        console.error("Erreur historique:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [history, sources, localSeries]);

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `A l'instant`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}j`;
  };

  if (loading) return (
    <div className="h-full bg-[#050810] flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chargement de l'historique</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#050810]">
      <header className="px-6 pt-6 pb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-100 uppercase tracking-tighter">Historique</h2>
        <div className="flex items-center gap-4">
           <button className="p-2 text-slate-400">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </button>
           <button className="p-2 text-slate-400">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
           </button>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-1000">
           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
             Aucune lecture récente. <br/> Vos chapitres lus apparaîtront ici.
           </p>
           <button onClick={() => window.location.reload()} className="mt-8 text-[#8ab4f8] font-black text-[10px] uppercase tracking-[0.2em] border border-[#8ab4f8]/20 px-8 py-3 rounded-full hover:bg-[#8ab4f8]/10 transition-all">Actualiser</button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
           {items.map(h => (
             <Link key={h.seriesId} to={`/reader/${h.seriesId}/${h.chapterId}`} className="flex gap-5 p-4 bg-slate-900/40 rounded-3xl border border-white/5 group active:bg-slate-900 transition-colors">
                <div className="w-16 h-24 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={h.series.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                   <div>
                     <h3 className="text-xs font-bold text-slate-100 uppercase truncate">{h.series.title}</h3>
                     <p className="text-[10px] text-[#8ab4f8] font-black uppercase mt-1">Chapitre {h.chapterId.split('-').pop()}</p>
                   </div>
                   <div className="flex items-center justify-between text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                     <span>{getTimeAgo(h.lastRead)}</span>
                     <div className="flex items-center gap-2">
                        <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-[#8ab4f8]" style={{ width: `${h.scrollPosition}%` }}></div>
                        </div>
                        <span>{Math.round(h.scrollPosition)}%</span>
                     </div>
                   </div>
                </div>
             </Link>
           ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
