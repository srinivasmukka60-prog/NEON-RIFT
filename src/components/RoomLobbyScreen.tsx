/**
 * NEON RIFT - Custom Room Lobby Screen
 */
import React, { useState } from 'react';
import { RoomState, CharacterId } from '../shared/types';
import { CHARACTERS } from '../shared/constants';
import {
  Copy,
  Check,
  Crown,
  Play,
  ArrowLeft,
  Users,
  Clock,
  Bot,
  Sparkles
} from 'lucide-react';

interface RoomLobbyScreenProps {
  roomState: RoomState;
  myPlayerId: string;
  onToggleReady: () => void;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
  onOpenCharacterSelect: () => void;
}

export const RoomLobbyScreen: React.FC<RoomLobbyScreenProps> = ({
  roomState,
  myPlayerId,
  onToggleReady,
  onStartMatch,
  onLeaveRoom,
  onOpenCharacterSelect
}) => {
  const [copied, setCopied] = useState(false);

  const isHost = roomState.hostId === myPlayerId;
  const myPlayer = roomState.players[myPlayerId];
  const players = Object.values(roomState.players);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allPlayersReady = players.every(p => p.isReady || p.id === roomState.hostId);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-6 bg-[#070b16] text-white overflow-y-auto">
      {/* Top Header */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-400 text-xs font-['Orbitron'] font-bold cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>EXIT ROOM</span>
        </button>

        {/* Room Code Badge */}
        <div className="flex items-center gap-2 bg-slate-900 border border-cyan-500/40 px-4 py-2 rounded-2xl shadow-lg shadow-cyan-950/40">
          <span className="text-xs font-mono text-slate-400">ROOM CODE:</span>
          <span className="text-2xl font-black font-['Orbitron'] tracking-widest text-cyan-400">
            {roomState.roomCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 transition-colors cursor-pointer"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Body: Player Slots (2 to 8) */}
      <div className="w-full max-w-5xl mx-auto my-auto py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-black font-['Orbitron'] text-white">
              SQUAD MANIFEST ({players.length}/{roomState.config.maxPlayers})
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>MATCH: {roomState.config.matchDurationSec}s</span>
          </div>
        </div>

        {/* Player Roster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {players.map(p => {
            const char = CHARACTERS[p.character] || CHARACTERS.vortex;
            const isMe = p.id === myPlayerId;
            const isPlayerHost = p.id === roomState.hostId;

            return (
              <div
                key={p.id}
                className={`relative p-5 rounded-2xl border transition-all flex flex-col items-center text-center ${
                  isMe
                    ? 'bg-slate-900/90 border-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                {/* Host Crown */}
                {isPlayerHost && (
                  <div className="absolute top-3 left-3 text-amber-400" title="Host">
                    <Crown className="w-4 h-4" />
                  </div>
                )}

                {/* Ready Status Badge */}
                <div className="absolute top-3 right-3">
                  {p.isReady ? (
                    <span className="px-2 py-0.5 rounded-full bg-green-950 border border-green-500 text-green-400 text-[9px] font-mono font-bold">
                      READY
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[9px] font-mono">
                      WAITING
                    </span>
                  )}
                </div>

                {/* Hero Avatar */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-black my-3 shadow-md border-2 border-white/20"
                  style={{ backgroundColor: p.color || char.primaryColor }}
                >
                  {char.name.substring(0, 3)}
                </div>

                <div className="font-['Orbitron'] font-bold text-sm text-white truncate max-w-[140px]">
                  {p.name} {isMe && <span className="text-cyan-400">(YOU)</span>}
                </div>
                <span className="text-xs text-slate-400 font-mono mt-0.5">
                  {char.name}
                </span>

                {isMe && (
                  <button
                    onClick={onOpenCharacterSelect}
                    className="mt-3 text-[10px] text-cyan-400 font-bold hover:underline cursor-pointer"
                  >
                    CHANGE HERO
                  </button>
                )}
              </div>
            );
          })}

          {/* Empty Slots */}
          {Array.from({ length: roomState.config.maxPlayers - players.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="p-5 rounded-2xl border-2 border-dashed border-slate-800/80 bg-slate-950/20 flex flex-col items-center justify-center text-center min-h-[160px]"
            >
              <span className="text-xs font-mono text-slate-600">SLOT {players.length + i + 1}</span>
              <span className="text-[11px] text-slate-600 mt-1">OPEN FOR PEER</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Controls: Ready & Start Match */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-4 border-t border-slate-800/80 pt-4">
        {/* Toggle Ready Button */}
        <button
          onClick={onToggleReady}
          className={`px-6 py-3.5 rounded-2xl font-['Orbitron'] font-bold text-xs tracking-wider cursor-pointer transition-all ${
            myPlayer?.isReady
              ? 'bg-slate-800 text-green-400 border border-green-500/50'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
          }`}
        >
          {myPlayer?.isReady ? 'READY (CANCEL)' : 'SET AS READY'}
        </button>

        {/* Host Start Match Button */}
        {isHost ? (
          <button
            onClick={onStartMatch}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-['Orbitron'] font-black text-sm tracking-wider cursor-pointer shadow-lg shadow-cyan-500/40 hover:shadow-cyan-400/60 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>LAUNCH MATCH</span>
          </button>
        ) : (
          <div className="text-xs text-slate-400 font-mono">
            AWAITING HOST TO LAUNCH MATCH...
          </div>
        )}
      </div>
    </div>
  );
};
