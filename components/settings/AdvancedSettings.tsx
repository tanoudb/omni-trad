
import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdvancedSettings: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-[#050810] z-[60] flex flex-col animate-in slide-in-from-right duration-300">
      <header className="px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-2xl font-bold">Avancé</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar py-10 px-6 text-center">
        <p className="text-slate-500 text-sm uppercase font-bold tracking-widest opacity-30">
          Aucun paramètre disponible pour le moment.
        </p>
      </div>
    </div>
  );
};

export default AdvancedSettings;
