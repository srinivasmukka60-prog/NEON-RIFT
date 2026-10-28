/**
 * NEON RIFT - Animated Welcome Screen
 */
import React from 'react';
import { Play, Shield, Zap, Sparkles, Volume2, VolumeX, Users, Bot, HelpCircle } from 'lucide-react';

interface WelcomeScreenProps {
  onQuickPlay: () => void;
  onPractice: () => void;
  onOpenLobby: () => void;
  onOpenHowToPlay: () => void;
  playerName: string;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onQuickPlay,
  onPractice,
  onOpenLobby,
  onOpenHowToPlay,
  playerName,
  isMuted,
  onToggleMute
}) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 overflow-hidden bg-[#060913] text-white">
      {/* Background Animated Neon Glow Aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-cyan-600/20 via-violet-600/20 to-transparent blur-[110px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-600/10 blur-[90px] rounded-full pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-5xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono tracking-widest text-cyan-400 font-bold uppercase">
            SERVER ONLINE // 30HZ TICK
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenHowToPlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-500/50 text-slate-300 text-xs font-['Rajdhani'] font-bold transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>HOW TO PLAY</span>
          </button>
          <button
            onClick={onToggleMute}
            className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-500/50 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Main Hero & Animated Logo */}
      <div className="flex flex-col items-center text-center z-10 my-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-widest mb-4 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>TOP-DOWN MULTIPLAYER SCI-FI ARENA</span>
        </div>

        {/* NEON RIFT Title with Chromatic Neon Glow */}
        <h1 className="text-6xl md:text-8xl font-black font-['Orbitron'] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_40px_rgba(0,245,255,0.7)]">
          NEON RIFT
        </h1>
        <p className="max-w-md text-sm md:text-base text-slate-300 font-['Rajdhani'] font-medium tracking-wide mt-2">
          Capture contested control zones, harvest high-yield energy crystals, and outmaneuver rivals with server-authoritative combat.
        </p>

        {/* Player Welcome Badge */}
        <div className="mt-4 px-4 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 font-mono">
          OPERATOR: <span className="text-cyan-400 font-bold">{playerName}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full max-w-md">
          <button
            onClick={onQuickPlay}
            className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-400 hover:from-cyan-400 hover:to-blue-500 text-black font-black font-['Orbitron'] tracking-wider text-base shadow-lg shadow-cyan-500/40 hover:shadow-cyan-400/60 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>PLAY ONLINE</span>
          </button>

          <button
            onClick={onPractice}
            className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold font-['Orbitron'] tracking-wider text-sm transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-slate-950"
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>PRACTICE VS BOTS</span>
          </button>
        </div>

        {/* Enter Custom Lobby Link */}
        <button
          onClick={onOpenLobby}
          className="mt-4 text-xs font-['Rajdhani'] font-bold text-slate-400 hover:text-cyan-400 tracking-widest uppercase transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Users className="w-3.5 h-3.5" />
          <span>ENTER CUSTOM LOBBY & LEADERBOARD</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-5xl flex items-center justify-between text-[11px] font-mono text-slate-500 z-10 border-t border-slate-800/60 pt-3">
        <span>MOBILE & DESKTOP COMPLIANT</span>
        <span>2–8 PLAYERS // 180S MATCHES</span>
      </div>
    </div>
  );
};
