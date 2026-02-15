
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category } from '../../types';

const LibrarySettings: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('omni_categories');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Ma bibliothèque' }];
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const updateCats = (newCats: Category[]) => {
    setCategories(newCats);
    localStorage.setItem('omni_categories', JSON.stringify(newCats));
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    const newCat = { id: `cat-${Date.now()}`, name: newCatName.trim() };
    updateCats([...categories, newCat]);
    setNewCatName('');
    setShowAddModal(false);
  };

  const removeCategory = (id: string) => {
    if (id === 'default') return;
    updateCats(categories.filter(c => c.id !== id));
  };

  const Section = ({ title, children }: any) => (
    <div className="py-4">
      <h3 className="px-6 py-2 text-xs font-black uppercase tracking-widest text-blue-500">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#050810] z-[60] flex flex-col animate-in slide-in-from-right duration-300">
      <header className="px-6 py-6 flex items-center gap-6 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-2xl font-bold uppercase tracking-tighter">Bibliothèque</h2>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <Section title="Catégories">
          {categories.map(cat => (
            <div key={cat.id} className="w-full flex items-center justify-between p-5 hover:bg-white/5 group border-b border-white/5">
              <div className="flex items-center gap-6">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                <span className="text-base font-medium text-slate-100 uppercase tracking-wide">{cat.name}</span>
              </div>
              {cat.id !== 'default' && (
                <button onClick={() => removeCategory(cat.id)} className="p-2 text-red-500/50 hover:text-red-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
          ))}
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center gap-6 p-5 text-blue-500 hover:bg-blue-500/5 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            <span className="text-sm font-black uppercase tracking-widest">Créer une catégorie</span>
          </button>
        </Section>

        <Section title="Affichage">
           <div className="w-full flex items-center justify-between p-5 hover:bg-white/5 group">
              <div className="flex items-center gap-6">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                <span className="text-base font-medium text-slate-100 uppercase tracking-wide">Mode d'affichage</span>
              </div>
              <span className="text-xs text-slate-500 font-bold uppercase">Grille</span>
           </div>
        </Section>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}>
          <div className="bg-[#1a1c22] w-full max-w-sm rounded-[2.5rem] p-8 space-y-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Nouvelle catégorie</h3>
            <input 
              type="text" 
              value={newCatName} 
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Nom de la bibliothèque"
              className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none ring-blue-500 focus:ring-2"
            />
            <div className="flex gap-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 text-slate-500 font-black uppercase text-[10px] py-3">Annuler</button>
              <button onClick={addCategory} className="flex-1 bg-blue-600 text-white font-black uppercase text-[10px] py-3 rounded-2xl">Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibrarySettings;
