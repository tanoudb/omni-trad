
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ReadingHistory, Source, Series } from '../types';
import { fetchAllFromSources } from '../services/sourceService';

interface HistoryPageProps {
  history: Record<string, ReadingHistory>;
  sources: Source[];
}

const HistoryPage: React.FC<HistoryPageProps> = ({ history, sources }) => {
  const [items, setItems] = useState<(ReadingHistory & { series: Series })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const allSeries = await fetchAllFromSources(sources);
      const historyList = (Object.values(history) as ReadingHistory[])
        .sort((a, b) => b.lastRead - a.lastRead)
        .map(h => {
          const series = allSeries.find(s => s.id === h.seriesId);
          if (!series) return null;
          return { ...h, series };
        })
        .filter((h): h is any => h !== null);
      
      setItems(historyList);
      setLoading(false);
    };
    loadData();
  }, [history, sources]);

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `Lu à l'instant`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Lu il y a ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Lu il y a ${hours}h`;
    return `Lu il y a ${Math.floor(hours / 24)}j`;
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-6 items-center">
            <div className="w-20 h-20 bg-slate-800 rounded-2xl"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-slate-800 rounded w-1/3"></div>
              <div className="h-3 bg-slate-800 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10 space-y-10 pb-32">
      <h2 className="text-3xl font-black tracking-tighter uppercase">Récemment lus</h2>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 opacity-30 gap-4">
           <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
           <p className="font-black uppercase tracking-[0.2em] text-xs">Aucun historique</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((h) => (
            <Link 
              key={h.seriesId}
              to={`/reader/${h.seriesId}/${h.chapterId}`}
              className="flex gap-6 p-4 rounded-3xl bg-slate-800/20 border border-slate-700/30 hover:bg-slate-800/40 hover:border-blue-500/30 transition-all group overflow-hidden"
            >
              <div className="w-24 h-24 flex-shrink-0 relative overflow-hidden rounded-2xl">
                <img src={h.series.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              
              <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-sm truncate uppercase tracking-tight group-hover:text-blue-400">{h.series.title}</h3>
                    <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap ml-2 uppercase tracking-widest">{getTimeAgo(h.lastRead)}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-bold">Chapitre {h.chapterId.split('-').pop()}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <span>Progression</span>
                    <span className="text-blue-500">{Math.round(h.scrollPosition)}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${h.scrollPosition}%` }}></div>
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
