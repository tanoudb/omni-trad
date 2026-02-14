
import React, { useState, useEffect, useRef } from 'react';
import { syncReadingTime } from '../services/supabaseService';

const ReadingTimer: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const lastActivity = useRef(Date.now());
  const lastSyncSeconds = useRef(0);
  const INACTIVITY_TIMEOUT = 60000; // 1 minute

  useEffect(() => {
    const handleActivity = () => {
      lastActivity.current = Date.now();
      if (!isActive) setIsActive(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsActive(false);
      } else {
        handleActivity();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      const now = Date.now();
      // Only increment if tab is visible AND user was active recently
      if (!document.hidden && (now - lastActivity.current < INACTIVITY_TIMEOUT)) {
        setSeconds(s => {
          const newTotal = s + 1;
          // Sync with "Supabase" every 5 minutes of real reading
          if (newTotal - lastSyncSeconds.current >= 300) {
            syncReadingTime(300);
            lastSyncSeconds.current = newTotal;
          }
          return newTotal;
        });
        if (!isActive) setIsActive(true);
      } else {
        if (isActive) setIsActive(false);
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 transition-all ${isActive ? 'opacity-100 scale-100' : 'opacity-40 scale-95 shadow-inner'}`}>
      <div className="relative flex">
         <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-600 animate-pulse'}`}></div>
      </div>
      <span className="text-[11px] font-black font-mono text-slate-200 tracking-wider">
        {formatTime(seconds)}
      </span>
    </div>
  );
};

export default ReadingTimer;
