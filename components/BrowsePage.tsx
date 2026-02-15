
import React, { useState, useRef } from 'react';
import { Source, Extension, Series, Category } from '../types';
import { RepoService } from '../services/repoService';
import { mapDirectoryToManga } from '../services/localFileService';

interface BrowsePageProps {
  sources: Source[];
  onAddSource: (name: string, url: string, categories?: string[]) => void;
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  onImportLocal: (series: Series) => void;
  categories: Category[];
}

const BrowsePage: React.FC<BrowsePageProps> = ({ sources, onAddSource, setSources, onImportLocal, categories }) => {
  const [activeSubTab, setActiveSubTab] = useState<'sources' | 'extensions'>('sources');
  const [repoUrl, setRepoUrl] = useState('');
  const [availableExtensions, setAvailableExtensions] = useState<Extension[]>([]);
  const [isFetchingRepo, setIsFetchingRepo] = useState(false);
  const [pendingSeries, setPendingSeries] = useState<{name: string, url: string} | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['default']);
  
  const folderInputRef = useRef<HTMLInputElement>(null);

  const loadRepo = async () => {
    if (!repoUrl) return;
    setIsFetchingRepo(true);
    try {
      const exts = await RepoService.fetchExtensions(repoUrl);
      setAvailableExtensions(exts);
    } catch (e) {
      alert("Erreur lors du chargement du dépôt JSON.");
    } finally {
      setIsFetchingRepo(false);
    }
  };

  const handleInstallClick = (name: string, url: string) => {
    setPendingSeries({ name, url });
    setShowCategoryPicker(true);
  };

  const confirmInstall = () => {
    if (pendingSeries) {
      onAddSource(pendingSeries.name, pendingSeries.url, selectedCategories);
      setPendingSeries(null);
      setShowCategoryPicker(false);
    }
  };

  const handleLocalImport = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const folderName = files[0].webkitRelativePath.split('/')[0] || "Source Locale";
      const localSeries = await mapDirectoryToManga(files, folderName);
      onImportLocal({ ...localSeries, categories: selectedCategories });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#050810]">
      <header className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight uppercase tracking-tighter">Parcourir</h2>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
            <button className="p-2 text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
          </div>
        </div>

        <div className="flex gap-8 border-b border-white/5">
          <button 
            onClick={() => setActiveSubTab('sources')}
            className={`pb-3 text-sm font-bold uppercase tracking-widest border-b-2 transition-all ${activeSubTab === 'sources' ? 'border-[#8ab4f8] text-[#8ab4f8]' : 'border-transparent text-slate-500'}`}
          >
            Sources
          </button>
          <button 
            onClick={() => setActiveSubTab('extensions')}
            className={`pb-3 text-sm font-bold uppercase tracking-widest border-b-2 transition-all ${activeSubTab === 'extensions' ? 'border-[#8ab4f8] text-[#8ab4f8]' : 'border-transparent text-slate-500'}`}
          >
            Extensions
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        {activeSubTab === 'sources' ? (
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Source locale</h3>
              <div className="flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#8ab4f8]/20 rounded-xl flex items-center justify-center text-[#8ab4f8]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Source locale</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Système de fichiers</p>
                  </div>
                </div>
                <button onClick={() => folderInputRef.current?.click()} className="text-[#8ab4f8] text-xs font-black uppercase tracking-widest px-4 py-2 hover:bg-[#8ab4f8]/10 rounded-xl transition-all">Commencer</button>
                <input type="file" ref={folderInputRef} onChange={(e) => handleLocalImport(e.target.files)} {...({ webkitdirectory: "", directory: "" } as any)} className="hidden" />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sources externes</h3>
              {sources.length === 0 ? (
                <div className="py-20 text-center space-y-4 opacity-10">
                   <span className="text-4xl font-black">(・_・)</span>
                   <p className="text-[10px] font-black uppercase tracking-widest">Aucune source active</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sources.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-white/5">
                      <div className="min-w-0 flex items-center gap-4">
                         <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                         </div>
                         <div className="truncate">
                            <h4 className="font-bold text-sm truncate uppercase">{s.name}</h4>
                            <p className="text-[10px] text-slate-500 font-bold truncate tracking-widest">{s.url}</p>
                         </div>
                      </div>
                      <button onClick={() => setSources(prev => prev.filter(x => x.id !== s.id))} className="text-red-500/40 hover:text-red-500 p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={repoUrl} 
                onChange={(e) => setRepoUrl(e.target.value)} 
                placeholder="URL du repo JSON" 
                className="flex-1 bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 ring-[#8ab4f8] text-white placeholder:text-slate-700"
              />
              <button onClick={loadRepo} className="px-6 bg-[#8ab4f8] rounded-2xl font-black text-[10px] uppercase tracking-widest text-[#050810]">{isFetchingRepo ? '...' : 'Explorer'}</button>
            </div>

            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Extensions disponibles</h3>
            <div className="space-y-4">
              {availableExtensions.map(ext => (
                <div key={ext.pkg} className="flex items-center justify-between p-5 bg-slate-900/40 rounded-[2rem] border border-white/5">
                   <div className="flex items-center gap-5">
                      <img src={ext.icon} className="w-12 h-12 rounded-xl bg-slate-800" onError={(e) => (e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${ext.name}`)} />
                      <div>
                        <h4 className="font-black text-xs uppercase text-white">{ext.name}</h4>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{ext.lang} • v{ext.version}</p>
                      </div>
                   </div>
                   <button onClick={() => handleInstallClick(ext.name, `https://api.${ext.baseUrl}/catalog.json`)} className="px-6 py-2 bg-white/5 hover:bg-[#8ab4f8] hover:text-[#050810] rounded-full text-[9px] font-black uppercase tracking-widest transition-all">Installer</button>
                </div>
              ))}
              {availableExtensions.length === 0 && (
                 <div className="py-20 text-center space-y-4 opacity-10">
                    <span className="text-4xl font-black">ಥ_ಥ</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">Aucune extension chargée</p>
                 </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showCategoryPicker && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6" onClick={() => setShowCategoryPicker(false)}>
          <div className="bg-[#1a1c22] w-full max-w-sm rounded-[2.5rem] p-8 space-y-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Ajouter à...</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
              {categories.map(cat => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button 
                    key={cat.id} 
                    onClick={() => setSelectedCategories(prev => isSelected ? prev.filter(id => id !== cat.id) : [...prev, cat.id])}
                    className="w-full flex items-center justify-between text-left p-2 rounded-xl hover:bg-white/5"
                  >
                    <span className={`text-sm font-bold uppercase tracking-wide ${isSelected ? 'text-[#8ab4f8]' : 'text-slate-300'}`}>{cat.name}</span>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'border-[#8ab4f8] bg-[#8ab4f8]' : 'border-slate-700'}`}>
                      {isSelected && <svg className="w-4 h-4 text-[#050810]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowCategoryPicker(false)} className="flex-1 text-slate-500 font-black uppercase tracking-widest text-[10px] py-3">Annuler</button>
              <button onClick={confirmInstall} className="flex-1 bg-[#8ab4f8] text-[#050810] font-black uppercase tracking-widest text-[10px] py-3 rounded-2xl shadow-xl shadow-blue-900/20">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowsePage;
