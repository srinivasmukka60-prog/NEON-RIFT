/**
 * NEON RIFT - Main Lobby Hub
 */
import React, { useState } from 'react';
import {
  Play,
  PlusCircle,
  LogIn,
  Bot,
  Trophy,
  User,
  Settings,
  HelpCircle,
  Sparkles,
  Zap,
  Shield,
  Radio,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { UserProfileData } from '../services/firebase';
import { CharacterId } from '../shared/types';
import { CHARACTERS } from '../shared/constants';

interface MainLobbyProps {
  profile: UserProfileData;
  onQuickPlay: () => void;
  onCreateRoom: () => void;
  onJoinRoomByCode: (code: string) => void;
  onPractice: () => void;
  onOpenCharacters: () => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
  onSignOut: () => void;
}

export const MainLobby: React.FC<MainLobbyProps> = ({
  profile,
  onQuickPlay,
  onCreateRoom,
  onJoinRoomByCode,
  onPractice,
  onOpenCharacters,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenSettings,
  onOpenHowToPlay,
  onOpenAuth,
  isAuthenticated,
  onSignOut
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  const selectedChar = CHARACTERS[profile.selectedCharacter as CharacterId] || CHARACTERS.vortex;

  // XP to next level (500 XP per level)
  const currentLevelBaseXp = (profile.level - 1) * 500;
  const currentLevelProgress = profile.xp - currentLevelBaseXp;
  const xpPercent = Math.min(100, Math.max(0, (currentLevelProgress / 500) * 100));

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCodeInput.trim().length >= 3) {
      onJoinRoomByCode(joinCodeInput.trim().toUpperCase());
      setShowJoinModal(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-6 overflow-y-auto bg-[#070b16] text-white">
      {/* Top Bar: Profile Summary, Level Bar & Settings */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-3 bg-slate-900/60 backdrop-blur-md p-3 px-4 rounded-2xl border border-slate-800 shadow-xl">
        {/* Left: Player Profile Pill */}
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-black border-2 border-white/30 shadow-md transition-transform group-hover:scale-105"
            style={{ backgroundColor: selectedChar.primaryColor }}
          >
            {profile.displayName.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-['Orbitron'] font-bold text-sm tracking-wide text-white">
                {profile.displayName}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 font-mono font-bold border border-cyan-800">
                LVL {profile.level}
              </span>
            </div>
            {/* XP Bar */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 md:w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentLevelProgress}/500 XP
              </span>
            </div>
          </div>
        </div>

        {/* Right: Auth, Leaderboard & Settings Buttons */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <button
              onClick={onSignOut}
              title="Sign Out"
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-300 text-xs font-['Orbitron'] font-bold transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>SIGN IN</span>
            </button>
          )}

          <button
            onClick={onOpenLeaderboard}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-amber-400 transition-colors cursor-pointer"
            title="Leaderboard"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-cyan-400 transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Body: Center Stage Hero & Play Modes */}
      <div className="w-full max-w-6xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center py-4">
        {/* Left Column: Active Hero Showcase */}
        <div
          onClick={onOpenCharacters}
          className="lg:col-span-5 relative bg-gradient-to-b from-slate-900/80 to-slate-950/90 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">
              ACTIVE COMBAT CHASSIS
            </span>
            <div className="flex items-center gap-1 text-xs text-cyan-400 font-bold font-['Rajdhani']">
              <span>SWAP HERO</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div className="flex items-center gap-5 my-5">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl text-black border-2 border-white/40 shadow-lg shadow-cyan-500/20"
              style={{ backgroundColor: selectedChar.primaryColor }}
            >
              {selectedChar.name.substring(0, 3)}
            </div>
            <div>
              <h2 className="text-3xl font-black font-['Orbitron'] text-white">
                {selectedChar.name}
              </h2>
              <p className="text-xs text-cyan-400 font-mono tracking-wider">
                {selectedChar.tagline}
              </p>
            </div>
          </div>

          {/* Hero Ability Highlights */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex flex-col items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <Zap className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="text-[10px] text-slate-400 font-mono">DASH</span>
              <span className="font-bold text-white">{(selectedChar.dashCooldown / 1000).toFixed(1)}s</span>
            </div>
            <div className="flex flex-col items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <Shield className="w-4 h-4 text-purple-400 mb-1" />
              <span className="text-[10px] text-slate-400 font-mono">SHIELD</span>
              <span className="font-bold text-white">{(selectedChar.shieldDuration / 1000).toFixed(1)}s</span>
            </div>
            <div className="flex flex-col items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <Radio className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[10px] text-slate-400 font-mono">PULSE</span>
              <span className="font-bold text-white">{selectedChar.pulseDamage} DMG</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400 font-['Rajdhani']">
            <span className="text-cyan-400 font-bold">PASSIVE:</span> {selectedChar.passiveBonus}
          </p>
        </div>

        {/* Right Column: Game Modes Grid */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Quick Play Card */}
          <button
            onClick={onQuickPlay}
            className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-cyan-600/90 via-blue-700/90 to-cyan-500/90 hover:from-cyan-500 hover:to-blue-600 border border-cyan-400/50 shadow-xl shadow-cyan-600/30 text-left transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="px-3 py-1 rounded-full bg-black/40 text-cyan-200 text-[10px] font-mono tracking-widest uppercase">
                  ONLINE MATCHMAKING // 2-8 PLAYERS
                </span>
                <h3 className="text-3xl font-black font-['Orbitron'] text-white mt-2">
                  QUICK MATCH
                </h3>
                <p className="text-xs text-cyan-100 font-['Rajdhani'] mt-1">
                  Queue into instant public match. Fight for crystals and capture zones.
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 fill-white text-white" />
              </div>
            </div>
          </button>

          {/* Secondary Modes: Create Room, Join Room, Practice */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Create Room */}
            <button
              onClick={onCreateRoom}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/50 text-left transition-all hover:-translate-y-0.5 cursor-pointer shadow-lg"
            >
              <PlusCircle className="w-5 h-5 text-violet-400 mb-2" />
              <h4 className="text-sm font-bold font-['Orbitron'] text-white">CREATE ROOM</h4>
              <p className="text-[11px] text-slate-400 font-['Rajdhani'] mt-0.5">
                Host custom match with shareable code
              </p>
            </button>

            {/* Join Room */}
            <button
              onClick={() => setShowJoinModal(true)}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left transition-all hover:-translate-y-0.5 cursor-pointer shadow-lg"
            >
              <LogIn className="w-5 h-5 text-cyan-400 mb-2" />
              <h4 className="text-sm font-bold font-['Orbitron'] text-white">JOIN ROOM</h4>
              <p className="text-[11px] text-slate-400 font-['Rajdhani'] mt-0.5">
                Enter friend's 4-digit room code
              </p>
            </button>

            {/* Practice Mode */}
            <button
              onClick={onPractice}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-left transition-all hover:-translate-y-0.5 cursor-pointer shadow-lg"
            >
              <Bot className="w-5 h-5 text-amber-400 mb-2" />
              <h4 className="text-sm font-bold font-['Orbitron'] text-white">VS AI BOTS</h4>
              <p className="text-[11px] text-slate-400 font-['Rajdhani'] mt-0.5">
                Solo arena drills with smart bots
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Quick Navigation Links */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
        <button
          onClick={onOpenHowToPlay}
          className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span className="font-['Rajdhani'] font-bold">RULES & ABILITIES</span>
        </button>

        <button
          onClick={onOpenProfile}
          className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <User className="w-4 h-4 text-cyan-400" />
          <span className="font-['Rajdhani'] font-bold">CAREER STATS ({profile.totalMatches} MATCHES / {profile.wins} WINS)</span>
        </button>
      </div>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-cyan-500/50 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-black font-['Orbitron'] text-white mb-1">
              JOIN PRIVATE ROOM
            </h3>
            <p className="text-xs text-slate-400 font-['Rajdhani'] mb-4">
              Enter the 4-character code shared by the room host.
            </p>

            <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                maxLength={4}
                value={joinCodeInput}
                onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="ABCD"
                className="w-full text-center tracking-[0.5em] text-3xl font-black font-['Orbitron'] p-3 rounded-2xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-cyan-300 outline-none uppercase"
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-['Orbitron'] font-bold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={joinCodeInput.trim().length < 3}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-['Orbitron'] font-black cursor-pointer shadow-md shadow-cyan-500/40"
                >
                  CONNECT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
