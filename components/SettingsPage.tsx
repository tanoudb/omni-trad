
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, getUserProfile, signOut, formatReadingTime } from '../services/supabaseService';
import { Source, Series } from '../types';
import ReadingTimer from './ReadingTimer';

interface SettingsPageProps {
  onAddSource: (name: string, url: string) => void;
  sources: Source[];
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  onImportLocal?: (series: Series) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const refresh = async () => {
      const profile = await getUserProfile();
      setUser(profile);
    };
    refresh();
    const interval = setInterval(refresh, 5000); // Rafraîchissement régulier pour le temps
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    const confirmLogout = window.confirm("Attention : Vous allez être déconnecté. Vos préférences locales seront conservées mais vous devrez vous identifier à nouveau.");
    if (confirmLogout) {
      signOut();
    }
  };

  const menuItems = [
    { label: 'Bibliothèque', path: '/settings/library', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    { label: 'À propos', path: '/settings/library', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  return (
    <div className="h-full flex flex-col bg-[#050810]">
      <header className="px-6 py-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white uppercase tracking-tighter">Plus</h2>
        <ReadingTimer />
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="p-6">
           <div className="relative group overflow-hidden p-8 bg-slate-900/40 rounded-[3rem] border border-white/5 transition-all hover:bg-slate-900/60">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#8ab4f8]/5 rounded-full blur-3xl group-hover:bg-[#8ab4f8]/10 transition-all"></div>
              
              <div className="relative flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 rounded-[2.5rem] overflow-hidden border-4 border-[#8ab4f8]/20 bg-slate-950 shadow-2xl relative">
                  <img 
                    src={user?.avatarUrl} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                  {/* Overlay pour donner un effet stylisé au personnage */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none"></div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                    {user?.username}
                  </h3>
                  {user?.isGuest && (
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-[8px] font-black uppercase tracking-widest">Compte Invité</span>
                  )}
                </div>

                <div className="grid grid-cols-1 w-full pt-4 border-t border-white/5">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Temps de lecture</p>
                    <p className="text-xl font-black text-[#8ab4f8]">{formatReadingTime(user?.totalReadingTimeSeconds || 0)}</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleSignOut} 
                className="absolute top-6 right-6 p-4 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                title="Déconnexion"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
           </div>
        </div>

        <div className="px-4 space-y-2">
          <p className="px-6 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Général</p>
          {menuItems.map((item, idx) => (
            <button 
              key={idx} 
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between p-6 bg-slate-900/20 hover:bg-white/5 rounded-[2.5rem] transition-all group border border-transparent hover:border-white/5"
            >
              <div className="flex items-center gap-6 text-slate-300 group-hover:text-blue-400 transition-colors">
                 <div className="w-10 h-10 flex items-center justify-center bg-slate-950 rounded-2xl group-hover:bg-[#8ab4f8]/10 transition-colors">
                   {item.icon}
                 </div>
                 <span className="text-sm font-bold uppercase tracking-wide">{item.label}</span>
              </div>
              <svg className="w-4 h-4 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
            </button>
          ))}
        </div>

        <div className="p-16 text-center opacity-20 select-none">
           <p className="text-[9px] font-black uppercase tracking-[0.5em] leading-relaxed">
             OMNIREAD v3.1.5 <br/> SESSION MANAGEMENT ACTIVE
           </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
