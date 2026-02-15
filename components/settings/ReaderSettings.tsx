
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ReaderSettings: React.FC = () => {
  const navigate = useNavigate();
  const [readingMode, setReadingMode] = useState('Webtoon');
  const [margins, setMargins] = useState(0);
  const [showModeModal, setShowModeModal] = useState(false);
  const [tactileZones, setTactileZones] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(false);
  const [watermark, setWatermark] = useState(false);

  const modes = [
    "Pagination (De gauche à droite)",
    "Pagination (De droite à gauche)",
    "Pagination (vertical)",
    "Continue en horizontal",
    "Horizontal en continu",
    "Vertical en continu",
    "Webtoon"
  ];

  const SettingItem = ({ icon, label, sublabel, onClick, pro, right }: any) => (
    <div className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors group cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-6">
        <div className="w-6 h-6 text-slate-400 group-hover:text-blue-400">{icon}</div>
        <div className="text-left">
          <p className="text-base font-medium text-slate-100 flex items-center gap-2">
            {label} {pro && <svg className="w-3 h-3 text-slate-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2L12.5 7H17.5L13.5 11L15 16L10 13L5 16L6.5 11L2.5 7H7.5L10 2Z" /></svg>}
          </p>
          {sublabel && <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{sublabel}</p>}
        </div>
      </div>
      {right ? right : <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>}
    </div>
  );

  const Toggle = ({ value, onChange }: any) => (
    <div onClick={(e) => { e.stopPropagation(); onChange(!value); }} className={`w-12 h-6 rounded-full p-1 transition-all cursor-pointer ${value ? 'bg-blue-500' : 'bg-slate-800'}`}>
      <div className={`w-4 h-4 bg-white rounded-full transition-all ${value ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#050810] z-[60] flex flex-col animate-in slide-in-from-right duration-300">
      <header className="px-6 py-6 flex items-center gap-6 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-2xl font-bold uppercase tracking-tighter">Lecteur</h2>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar py-4">
        <SettingItem 
          label="Mode de lecture" 
          sublabel={readingMode} 
          onClick={() => setShowModeModal(true)}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>}
        />
        <SettingItem 
          label="Disposition de la page" 
          sublabel="Page simple" 
          pro 
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />
        <SettingItem 
          label="Zones tactiles" 
          sublabel={tactileZones ? "Activée" : "Désactivée"}
          onClick={() => setTactileZones(!tactileZones)}
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.268 0 2.39.234 3.41.659m-4.74 12.892A8 8 0 1118 3.405a5.921 5.921 0 00-2.281 1.176" /></svg>}
          right={<Toggle value={tactileZones} onChange={setTactileZones} />}
        />
        
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-6">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            <div className="flex-1">
              <p className="text-base font-medium text-slate-100">Marges du lecteur</p>
              <div className="flex items-center gap-4 mt-2">
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={margins} 
                  onChange={(e) => setMargins(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                />
                <span className="text-sm font-mono text-slate-400 w-10 text-right">{(margins/100).toFixed(2)}</span>
              </div>
            </div>
            <button onClick={() => setMargins(0)} className="p-2 text-slate-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
          </div>
        </div>

        <SettingItem 
          label="Passer les chapitres en double" 
          sublabel="Afficher uniquement le scanlateur prioritaire" 
          pro 
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          right={<Toggle value={skipDuplicates} onChange={setSkipDuplicates} />}
          onClick={() => setSkipDuplicates(!skipDuplicates)}
        />

        <SettingItem 
          label="Filigrane lors du partage" 
          sublabel="Ajouter OmniRead sur les images enregistrées" 
          pro 
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          right={<Toggle value={watermark} onChange={setWatermark} />}
          onClick={() => setWatermark(!watermark)}
        />

        <SettingItem 
          label="Avancé" 
          sublabel="Geste, zoom et barre d'état" 
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
          onClick={() => navigate('/settings/advanced')}
        />
      </div>

      {showModeModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6" onClick={() => setShowModeModal(false)}>
          <div className="bg-[#1a1c22] w-full max-w-sm rounded-[2.5rem] p-8 space-y-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Mode de lecture</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
              {modes.map(m => (
                <button 
                  key={m} 
                  onClick={() => { setReadingMode(m); setShowModeModal(false); }}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <span className={`text-sm font-bold uppercase tracking-wide ${readingMode === m ? 'text-blue-400' : 'text-slate-300'}`}>{m}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${readingMode === m ? 'border-blue-500 bg-blue-500' : 'border-slate-700'}`}>
                    {readingMode === m && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowModeModal(false)} className="w-full text-right text-blue-400 font-bold uppercase tracking-widest text-xs pt-4">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderSettings;
