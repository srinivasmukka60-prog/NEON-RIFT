/**
 * NEON RIFT - Global & Weekly Leaderboard Screen
 */
import React, { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../services/firebase';
import {
  Trophy,
  Crown,
  ArrowLeft,
  Medal,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface LeaderboardScreenProps {
  onBack: () => void;
  myUserId: string;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  onBack,
  myUserId
}) => {
  const [tab, setTab] = useState<'all_time' | 'weekly'>('all_time');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchLeaderboard();
    // If no Firestore records yet, provide initial competitive seed
    if (!data || data.length === 0) {
      setEntries([
        { userId: '1', displayName: 'CYBER_VIPER', score: 4850, wins: 28, level: 12 },
        { userId: '2', displayName: 'NEXUS_VALKYRIE', score: 3920, wins: 21, level: 10 },
        { userId: '3', displayName: 'ZERO_FLUX', score: 3100, wins: 18, level: 8 },
        { userId: '4', displayName: 'SYNTH_GHOST', score: 2450, wins: 14, level: 6 },
        { userId: '5', displayName: 'NEON_RONIN', score: 1890, wins: 9, level: 5 }
      ]);
    } else {
      setEntries(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-6 bg-[#070b16] text-white overflow-y-auto">
      {/* Header */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 text-xs font-['Orbitron'] font-bold cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>BACK</span>
        </button>

        <div className="text-right">
          <h2 className="text-xl md:text-2xl font-black font-['Orbitron'] text-white">
            HALL OF CHAMPIONS
          </h2>
          <p className="text-[11px] font-mono text-cyan-400 tracking-wider">
            GLOBAL COMPETITIVE RANKINGS
          </p>
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="w-full max-w-4xl mx-auto my-auto py-4">
        {/* Tab Filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTab('all_time')}
              className={`px-4 py-1.5 rounded-lg text-xs font-['Orbitron'] font-bold cursor-pointer transition-colors ${
                tab === 'all_time' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              ALL-TIME
            </button>
            <button
              onClick={() => setTab('weekly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-['Orbitron'] font-bold cursor-pointer transition-colors ${
                tab === 'weekly' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              WEEKLY CYCLE
            </button>
          </div>

          <button
            onClick={loadData}
            title="Refresh Leaderboard"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* Entries List */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-12 gap-2 p-3.5 px-5 bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            <div className="col-span-2">RANK</div>
            <div className="col-span-5">OPERATOR</div>
            <div className="col-span-2 text-center">LEVEL</div>
            <div className="col-span-3 text-right">SCORE / XP</div>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[420px] overflow-y-auto">
            {entries.map((entry, index) => {
              const rank = index + 1;
              const isMe = entry.userId === myUserId;

              return (
                <div
                  key={entry.userId || index}
                  className={`grid grid-cols-12 gap-2 p-3.5 px-5 items-center transition-colors ${
                    isMe
                      ? 'bg-cyan-950/30 border-l-4 border-cyan-400'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-2 flex items-center gap-2">
                    {rank === 1 ? (
                      <Crown className="w-5 h-5 text-amber-400" />
                    ) : rank === 2 ? (
                      <Medal className="w-5 h-5 text-slate-300" />
                    ) : rank === 3 ? (
                      <Medal className="w-5 h-5 text-amber-600" />
                    ) : (
                      <span className="font-mono text-sm font-bold text-slate-400 pl-1">
                        #{rank}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="col-span-5 flex items-center gap-2.5 truncate">
                    <span className="font-['Orbitron'] font-bold text-sm text-white truncate">
                      {entry.displayName}
                    </span>
                    {isMe && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-mono">
                        YOU
                      </span>
                    )}
                  </div>

                  {/* Level */}
                  <div className="col-span-2 text-center">
                    <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                      LVL {entry.level || 1}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="col-span-3 text-right">
                    <span className="font-['Orbitron'] font-black text-sm text-amber-400">
                      {entry.score.toLocaleString()} <span className="text-[10px] text-amber-300">PTS</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto text-center text-xs text-slate-500 font-mono">
        LEADERBOARD SCORES CALCULATED VIA AUTHORITATIVE SERVER MATCH VALIDATION
      </div>
    </div>
  );
};
