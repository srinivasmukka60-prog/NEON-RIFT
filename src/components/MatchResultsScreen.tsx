/**
 * NEON RIFT - Match Results & Podium Screen
 */
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { MatchResults, MatchResultPlayer } from '../shared/types';
import { UserProfileData } from '../services/firebase';
import {
  Trophy,
  Crown,
  Gem,
  Flag,
  Crosshair,
  ArrowRight,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface MatchResultsScreenProps {
  results: MatchResults;
  myPlayerId: string;
  profile: UserProfileData;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
}

export const MatchResultsScreen: React.FC<MatchResultsScreenProps> = ({
  results,
  myPlayerId,
  profile,
  onPlayAgain,
  onReturnToLobby
}) => {
  const isWinner = results.winner?.id === myPlayerId;
  const myResult = results.players.find(p => p.id === myPlayerId);

  useEffect(() => {
    if (isWinner) {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#00f5ff', '#bf55ec', '#ffaa00', '#ffffff']
      });
    }
  }, [isWinner]);

  // Sort top 3 for podium
  const podium = results.players.slice(0, 3);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-6 bg-[#070b16] text-white overflow-y-auto">
      {/* Top Banner */}
      <div className="w-full max-w-4xl mx-auto text-center pt-2">
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-widest mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>MATCH COMPLETE // ROOM {results.roomCode}</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black font-['Orbitron'] tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-300">
          {isWinner ? 'VICTORY SECURED' : 'ARENA CONCLUDED'}
        </h1>
      </div>

      {/* Podium Top 3 */}
      <div className="w-full max-w-4xl mx-auto my-auto py-4">
        <div className="grid grid-cols-3 gap-3 md:gap-5 items-end max-w-2xl mx-auto mb-8">
          {/* 2nd Place */}
          {podium[1] ? (
            <div className="flex flex-col items-center bg-slate-900/60 border border-slate-800 rounded-2xl p-3 md:p-4 pb-6">
              <span className="text-xs font-['Orbitron'] font-bold text-slate-400">#2</span>
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black text-black my-2 text-sm"
                style={{ backgroundColor: podium[1].color }}
              >
                {podium[1].name.substring(0, 2)}
              </div>
              <span className="text-xs font-bold font-['Orbitron'] truncate max-w-[100px]">
                {podium[1].name}
              </span>
              <span className="text-sm font-black font-['Orbitron'] text-cyan-400 mt-1">
                {podium[1].score} PTS
              </span>
            </div>
          ) : <div />}

          {/* 1st Place Champion */}
          {podium[0] && (
            <div className="flex flex-col items-center bg-gradient-to-b from-amber-950/40 to-slate-900 border-2 border-amber-400/80 rounded-3xl p-4 md:p-6 pb-8 shadow-xl shadow-amber-500/20 -translate-y-2">
              <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center font-black text-black my-2 text-lg shadow-lg border-2 border-white/50"
                style={{ backgroundColor: podium[0].color }}
              >
                {podium[0].name.substring(0, 2)}
              </div>
              <span className="text-sm md:text-base font-black font-['Orbitron'] truncate max-w-[140px]">
                {podium[0].name}
              </span>
              <span className="text-lg md:text-xl font-black font-['Orbitron'] text-amber-400 mt-1">
                {podium[0].score} PTS
              </span>
              <span className="text-[10px] text-amber-300 font-mono mt-0.5">CHAMPION</span>
            </div>
          )}

          {/* 3rd Place */}
          {podium[2] ? (
            <div className="flex flex-col items-center bg-slate-900/60 border border-slate-800 rounded-2xl p-3 md:p-4 pb-4">
              <span className="text-xs font-['Orbitron'] font-bold text-slate-400">#3</span>
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black text-black my-2 text-sm"
                style={{ backgroundColor: podium[2].color }}
              >
                {podium[2].name.substring(0, 2)}
              </div>
              <span className="text-xs font-bold font-['Orbitron'] truncate max-w-[100px]">
                {podium[2].name}
              </span>
              <span className="text-sm font-black font-['Orbitron'] text-cyan-400 mt-1">
                {podium[2].score} PTS
              </span>
            </div>
          ) : <div />}
        </div>

        {/* Player Stats Breakdown Card */}
        {myResult && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 max-w-xl mx-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">YOUR PERFORMANCE</span>
                <div className="text-base font-black font-['Orbitron'] text-white">
                  RANK #{myResult.rank} // {myResult.score} PTS
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-cyan-400 uppercase">XP REWARD</span>
                <div className="text-base font-black font-['Orbitron'] text-cyan-300">
                  +{myResult.xpEarned} XP
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <Gem className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 font-mono block">CRYSTALS</span>
                <span className="font-bold text-white text-sm">{myResult.crystalsCollected}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <Flag className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 font-mono block">ZONE TIME</span>
                <span className="font-bold text-white text-sm">{myResult.zonesCapturedSec}s</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <Crosshair className="w-4 h-4 text-red-400 mx-auto mb-1" />
                <span className="text-[10px] text-slate-400 font-mono block">TAKEDOWNS</span>
                <span className="font-bold text-white text-sm">{myResult.takedowns}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4 border-t border-slate-800/80 pt-4">
        <button
          onClick={onReturnToLobby}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-['Orbitron'] font-bold cursor-pointer transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>RETURN TO LOBBY</span>
        </button>

        <button
          onClick={onPlayAgain}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black font-['Orbitron'] tracking-wider shadow-lg shadow-cyan-500/40 cursor-pointer transition-all transform hover:-translate-y-0.5"
        >
          <span>PLAY AGAIN</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
