
import React, { useState } from 'react';
import { saveUserProfile } from '../services/supabaseService';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'welcome' | 'setup'>('welcome');
  const [username, setUsername] = useState('');

  const handleStart = () => setStep('setup');
  
  const handleComplete = async (isGuest: boolean) => {
    await saveUserProfile(isGuest ? "Invité" : username, isGuest);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#050810] flex flex-col items-center justify-center p-8 text-center overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-[#8ab4f8]/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-blue-600/10 rounded-full blur-[120px]"></div>

      {step === 'welcome' ? (
        <div className="max-w-md w-full space-y-12 animate-in fade-in zoom-in duration-700">
          <div className="space-y-6">
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-[#8ab4f8] rounded-[2.5rem] mx-auto shadow-2xl shadow-blue-500/20 flex items-center justify-center rotate-3">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white">OMNIREAD</h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] leading-relaxed">
              Votre sanctuaire personnel <br/> pour la lecture de mangas
            </p>
          </div>
          
          <button 
            onClick={handleStart}
            className="w-full py-5 bg-[#8ab4f8] text-[#050810] rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/10 active:scale-95 transition-all"
          >
            Commencer l'aventure
          </button>
        </div>
      ) : (
        <div className="max-w-md w-full space-y-10 animate-in slide-in-from-bottom-8 duration-500">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Qui êtes-vous ?</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Choisissez un nom pour votre profil</p>
          </div>

          <div className="space-y-4">
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre pseudo..."
              className="w-full bg-slate-900 border border-white/5 rounded-3xl p-6 text-center text-lg font-black text-white outline-none focus:ring-4 ring-blue-500/20 transition-all placeholder:text-slate-800"
            />
            
            <button 
              onClick={() => handleComplete(false)}
              disabled={!username.trim()}
              className="w-full py-5 bg-white text-[#050810] rounded-3xl font-black text-xs uppercase tracking-[0.2em] disabled:opacity-20 transition-all"
            >
              Créer mon compte
            </button>

            <button 
              onClick={() => handleComplete(true)}
              className="w-full py-5 bg-transparent text-slate-500 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:text-white transition-all"
            >
              Continuer en invité
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
