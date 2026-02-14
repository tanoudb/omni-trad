
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, getUserProfile, signOut } from '../services/supabaseService';
import { Source, Series } from '../types';
import { LocalFileSystemProvider, processLocalFile } from '../services/localFileService';
import { saveChapterOffline } from '../services/downloadService';

interface SettingsPageProps {
  onAddSource: (name: string, url: string) => void;
  sources: Source[];
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  onImportLocal?: (series: Series) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onAddSource, sources, setSources, onImportLocal }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [showExtensions, setShowExtensions] = useState(false);
  
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getUserProfile().then(setUser);
  }, []);

  const clearCache = () => {
    localStorage.clear();
    setCacheCleared(true);
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleAddExtension = () => {
    if (!newUrl.startsWith('http')) {
      setError('Format d\'URL JSON invalide');
      return;
    }
    onAddSource(newName || 'Source personnalisée', newUrl);
    setNewUrl('');
    setNewName('');
    setError('');
  };

  const handleLocalImport = async (files: FileList | null, isFolder: boolean) => {
    if (!files || files.length === 0) return;

    setIsImporting(true);
    setError('');
    
    try {
      let localSeries: Series;
      if (isFolder) {
        const folderName = files[0].webkitRelativePath.split('/')[0] || "Dossier Importé";
        localSeries = await LocalFileSystemProvider.mapDirectoryToManga(files, folderName);
      } else {
        localSeries = await processLocalFile(files[0]);
      }
      
      // Persistance complète
      for (const ch of localSeries.chapters) {
        await saveChapterOffline(localSeries.id, ch.id, ch.pages);
      }
      
      if (onImportLocal) onImportLocal(localSeries);
      alert(`Importation réussie : ${localSeries.title}`);
    } catch (err: any) {
      setError(err.message || "Erreur de scan local");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const removeSource = (id: string) => {
    if (sources.length <= 1) return;
    setSources(sources.filter(s => s.id !== id));
  };

  if (showExtensions) {
    return (
      <div className="h-full overflow-y-auto no-scrollbar p-6 md:p-10 pb-32 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="max-w-xl mx-auto space-y-10">
          <div className="flex items-center gap-6">
            <button onClick={() => setShowExtensions(false)} className="p-4 bg-slate-900 border border-white/5 rounded-2xl hover:bg-slate-800 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-3xl font-black tracking-tighter uppercase">Extensions</h2>
          </div>

          {/* Engine Card */}
          <section className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-500/20 space-y-8 relative overflow-hidden">
             <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
             <div className="relative z-10 flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 bg-white/10 rounded-3xl backdrop-blur-md flex items-center justify-center border border-white/20">
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-widest">Natural Engine</h3>
                  <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">Recursive local file indexing</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button 
                    onClick={() => folderInputRef.current?.click()}
                    disabled={isImporting}
                    className="bg-white text-blue-700 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Scanner Dossier
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="bg-white/10 text-white border border-white/20 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95"
                  >
                    Importer Archive
                  </button>
                </div>

                {isImporting && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[9px] font-black uppercase tracking-widest">Analyse de l'arborescence...</span>
                  </div>
                )}
             </div>
             {/* Fix: Use any casting for non-standard webkitdirectory and directory attributes on input to bypass TS errors */}
             <input 
               type="file" 
               ref={folderInputRef} 
               onChange={(e) => handleLocalImport(e.target.files, true)} 
               {...({ webkitdirectory: "", directory: "" } as any)} 
               className="hidden" 
             />
             <input type="file" ref={fileInputRef} onChange={(e) => handleLocalImport(e.target.files, false)} accept=".zip,.cbz,.epub" className="hidden" />
          </section>

          {/* Add Remote Source */}
          <section className="bg-slate-900/50 p-8 rounded-[2rem] border border-white/5 space-y-6">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Ajouter une source JSON</h3>
             <div className="space-y-4">
                <input type="text" placeholder="Nom" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 ring-blue-500 transition-all" />
                <input type="url" placeholder="URL du catalogue" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 ring-blue-500 transition-all" />
                {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-1">{error}</p>}
                <button onClick={handleAddExtension} className="w-full bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Connecter</button>
             </div>
          </section>

          {/* Active List */}
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Extensions actives</h3>
            <div className="space-y-3">
              {sources.map(s => (
                <div key={s.id} className="bg-slate-900/30 p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                  <div className="min-w-0 pr-4">
                    <h4 className="font-bold text-sm truncate uppercase">{s.name}</h4>
                    <p className="text-[10px] text-slate-600 truncate mt-0.5">{s.url}</p>
                  </div>
                  <button onClick={() => removeSource(s.id)} disabled={sources.length <= 1} className="p-2.5 text-slate-700 hover:text-red-500 rounded-xl transition-all disabled:opacity-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 md:p-10 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-xl mx-auto space-y-10">
        <h2 className="text-3xl font-black tracking-tighter uppercase">Paramètres</h2>

        {/* Profile Card */}
        <section className="bg-slate-900/50 rounded-[2.5rem] p-10 border border-white/5 flex flex-col items-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-blue-500/20 p-1 bg-gradient-to-tr from-blue-500 to-indigo-500">
              <img src={user?.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover bg-slate-950 border-4 border-[#050810]" />
            </div>
            <div className="absolute bottom-1 right-1 w-7 h-7 bg-blue-500 border-4 border-[#050810] rounded-full shadow-lg"></div>
          </div>
          <h3 className="mt-6 text-2xl font-black tracking-tight">{user?.username || 'Sung Jin-Woo'}</h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Lecteur OMNI • Rang S</p>
          
          <button onClick={signOut} className="mt-10 px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-xl shadow-red-900/10">
            Déconnexion
          </button>
        </section>

        {/* Navigation Tiles */}
        <div className="grid grid-cols-1 gap-4">
          <button onClick={() => setShowExtensions(true)} className="w-full flex items-center justify-between p-7 bg-slate-900/50 rounded-3xl border border-white/5 hover:bg-slate-900/80 transition-all group">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div className="text-left">
                <p className="font-black text-sm uppercase tracking-tight">Extensions & Import</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Moteur de Scan Local</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-700 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </button>

          <div className="flex items-center justify-between p-7 bg-slate-900/50 rounded-3xl border border-white/5">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
              <div className="text-left">
                <p className="font-black text-sm uppercase tracking-tight">Données de lecture</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vider le catalogue local</p>
              </div>
            </div>
            <button onClick={clearCache} className={`text-[9px] font-black uppercase tracking-widest px-8 py-3 rounded-xl transition-all ${cacheCleared ? 'text-green-400 bg-green-500/10' : 'text-slate-400 bg-white/5 hover:bg-white/10'}`}>
              {cacheCleared ? 'Effectué' : 'Réinitialiser'}
            </button>
          </div>
        </div>

        <footer className="pt-20 pb-10 text-center space-y-3 opacity-20 hover:opacity-100 transition-opacity">
          <p className="text-slate-500 text-[10px] font-black tracking-[0.6em] uppercase">OMNI-READ STATION</p>
          <div className="h-px w-20 bg-slate-800 mx-auto"></div>
          <p className="text-slate-700 text-[10px] font-black tracking-[0.2em] uppercase">VERSION 1.5.0 • NATURAL SORT ENGINE</p>
        </footer>
      </div>
    </div>
  );
};

export default SettingsPage;
