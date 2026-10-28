/**
 * NEON RIFT - Player Career Profile Screen
 */
import React, { useState } from 'react';
import { UserProfileData } from '../services/firebase';
import {
  ArrowLeft,
  User,
  Trophy,
  Target,
  Gem,
  Award,
  Check,
  Edit2,
  Sparkles
} from 'lucide-react';
import { CHARACTERS } from '../shared/constants';

interface ProfileScreenProps {
  profile: UserProfileData;
  onUpdateProfile: (updated: Partial<UserProfileData>) => void;
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onUpdateProfile,
  onBack
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile.displayName);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const winRate = profile.totalMatches > 0
    ? Math.round((profile.wins / profile.totalMatches) * 100)
    : 0;

  const currentLevelBaseXp = (profile.level - 1) * 500;
  const currentLevelProgress = profile.xp - currentLevelBaseXp;
  const xpPercent = Math.min(100, Math.max(0, (currentLevelProgress / 500) * 100));

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim().length >= 2) {
      onUpdateProfile({ displayName: nameInput.trim() });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

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
            OPERATOR DOSSIER
          </h2>
          <p className="text-[11px] font-mono text-cyan-400 tracking-wider">
            COMBAT STATS & PROGRESSION
          </p>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="w-full max-w-4xl mx-auto my-auto py-4 flex flex-col gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl">
          {/* Top Info Banner */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800">
            {/* Avatar Pill */}
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-2xl text-black border-2 border-white/50 shadow-xl shadow-cyan-500/30">
                {profile.displayName.substring(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono text-[10px] font-bold">
                LVL {profile.level}
              </div>
            </div>

            {/* Name & Editing */}
            <div className="flex-1 text-center sm:text-left">
              {isEditing ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-2 max-w-xs">
                  <input
                    type="text"
                    value={nameInput}
                    maxLength={16}
                    onChange={e => setNameInput(e.target.value)}
                    className="p-2 px-3 rounded-xl bg-slate-950 border border-cyan-400 text-white font-['Orbitron'] font-bold text-sm outline-none w-full"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl md:text-3xl font-black font-['Orbitron'] text-white">
                    {profile.displayName}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                    title="Edit Callsign"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {saveSuccess && (
                    <span className="text-[10px] text-green-400 font-mono font-bold animate-fade-in">
                      SAVED
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-400 font-mono mt-1">
                ID: {profile.id} // ACTIVE OPERATOR
              </p>

              {/* Level XP Bar */}
              <div className="mt-3 max-w-sm">
                <div className="flex justify-between text-xs text-slate-400 font-mono mb-1">
                  <span>LEVEL {profile.level} PROGRESS</span>
                  <span className="text-cyan-400">{currentLevelProgress} / 500 XP</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Career Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
              <Trophy className="w-5 h-5 text-amber-400 mb-1" />
              <span className="text-[10px] text-slate-400 font-mono uppercase">TOTAL VICTORIES</span>
              <span className="text-2xl font-black font-['Orbitron'] text-white mt-1">
                {profile.wins}
              </span>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
              <Target className="w-5 h-5 text-cyan-400 mb-1" />
              <span className="text-[10px] text-slate-400 font-mono uppercase">MATCHES PLAYED</span>
              <span className="text-2xl font-black font-['Orbitron'] text-white mt-1">
                {profile.totalMatches}
              </span>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
              <Award className="w-5 h-5 text-purple-400 mb-1" />
              <span className="text-[10px] text-slate-400 font-mono uppercase">WIN RATE</span>
              <span className="text-2xl font-black font-['Orbitron'] text-purple-400 mt-1">
                {winRate}%
              </span>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
              <Gem className="w-5 h-5 text-green-400 mb-1" />
              <span className="text-[10px] text-slate-400 font-mono uppercase">TOTAL XP</span>
              <span className="text-2xl font-black font-['Orbitron'] text-green-400 mt-1">
                {profile.xp.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto text-center text-xs text-slate-500 font-mono">
        DATA PERSISTED SECURELY TO CLOUD FIRESTORE
      </div>
    </div>
  );
};
