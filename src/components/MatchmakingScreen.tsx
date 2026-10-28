/**
 * NEON RIFT - Matchmaking Waiting Screen
 */
import React, { useState, useEffect } from 'react';
import { Wifi, X, Shield, Sparkles } from 'lucide-react';

interface MatchmakingScreenProps {
  onCancel: () => void;
  characterName: string;
}

export const MatchmakingScreen: React.FC<MatchmakingScreenProps> = ({
  onCancel,
  characterName
}) => {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;
  const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-[#060913] text-white">
      {/* Background glow */}
      <div className="absolute w-[450px] h-[450px] rounded-full bg-cyan-600/15 blur-[120px] pointer-events-none" />

      {/* Cyber Holographic Radar */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border border-cyan-500/30 flex items-center justify-center shadow-2xl shadow-cyan-950/60 mb-8">
        {/* Concentric rings */}
        <div className="w-48 h-48 md:w-60 md:h-60 rounded-full border border-cyan-500/20 flex items-center justify-center">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-cyan-500/25 flex items-center justify-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-cyan-950/60 border border-cyan-400 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
            </div>
          </div>
        </div>

        {/* Rotating sweep cone */}
        <div className="absolute inset-0 rounded-full overflow-hidden animate-[spin_3s_linear_infinite] pointer-events-none">
          <div className="w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/40 via-cyan-500/10 to-transparent origin-bottom-right" />
        </div>

        {/* Grid axes */}
        <div className="absolute w-full h-px bg-cyan-500/20" />
        <div className="absolute h-full w-px bg-cyan-500/20" />
      </div>

      {/* Text Status */}
      <h2 className="text-2xl md:text-3xl font-black font-['Orbitron'] text-white tracking-widest text-center">
        SEARCHING NEON ARENA...
      </h2>
      <p className="text-xs text-cyan-400 font-mono tracking-widest mt-1">
        LOOKING FOR COMPETITIVE PEERS // REGION GLOBAL
      </p>

      {/* Time & Chassis Info */}
      <div className="flex items-center gap-4 mt-6 bg-slate-900/80 px-5 py-2.5 rounded-2xl border border-slate-800">
        <div className="text-center">
          <span className="text-[10px] text-slate-400 font-mono block">ELAPSED TIME</span>
          <span className="text-xl font-['Orbitron'] font-black text-cyan-400">{timeStr}</span>
        </div>
        <div className="w-px h-8 bg-slate-700" />
        <div className="text-center">
          <span className="text-[10px] text-slate-400 font-mono block">HERO CHASSIS</span>
          <span className="text-sm font-['Orbitron'] font-bold text-white">{characterName}</span>
        </div>
      </div>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="mt-8 flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900/90 hover:bg-red-950/60 border border-slate-700 hover:border-red-500 text-slate-300 hover:text-red-400 text-xs font-['Orbitron'] font-bold tracking-wider transition-all cursor-pointer"
      >
        <X className="w-4 h-4" />
        <span>CANCEL SEARCH</span>
      </button>
    </div>
  );
};
