/**
 * NEON RIFT - In-Game HUD & Mobile Touch Controls
 * Virtual joystick, ability buttons with cooldown sweeps, health bar, minimap, and scoreboard.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  RoomState,
  PlayerInput,
  CharacterDef
} from '../shared/types';
import { CHARACTERS, ARENA_WIDTH, ARENA_HEIGHT } from '../shared/constants';
import {
  Zap,
  Shield,
  Radio,
  Clock,
  Gem,
  Crosshair,
  Flag,
  Wifi,
  ChevronRight,
  LogOut,
  Sparkles
} from 'lucide-react';

interface HUDProps {
  roomState: RoomState;
  myPlayerId: string;
  onSendInput: (input: PlayerInput) => void;
  onLeaveMatch: () => void;
  pingMs: number;
}

export const HUD: React.FC<HUDProps> = ({
  roomState,
  myPlayerId,
  onSendInput,
  onLeaveMatch,
  pingMs
}) => {
  const myPlayer = roomState.players[myPlayerId];
  const charDef: CharacterDef = myPlayer
    ? CHARACTERS[myPlayer.character] || CHARACTERS.vortex
    : CHARACTERS.vortex;

  // Joystick touch state
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickOrigin, setJoystickOrigin] = useState({ x: 0, y: 0 });
  const [joystickDelta, setJoystickDelta] = useState({ x: 0, y: 0 });
  const inputSeqRef = useRef<number>(0);

  // Keyboard controls state
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const lastVectorRef = useRef({ dx: 0, dy: 0 });

  // Ability triggers
  const triggerDash = () => {
    if (!myPlayer) return;
    const now = Date.now();
    if (now >= myPlayer.dashCooldownUntil) {
      inputSeqRef.current += 1;
      onSendInput({
        seq: inputSeqRef.current,
        dx: lastVectorRef.current.dx,
        dy: lastVectorRef.current.dy,
        dash: true,
        timestamp: now
      });
    }
  };

  const triggerShield = () => {
    if (!myPlayer) return;
    const now = Date.now();
    if (now >= myPlayer.shieldCooldownUntil) {
      inputSeqRef.current += 1;
      onSendInput({
        seq: inputSeqRef.current,
        dx: lastVectorRef.current.dx,
        dy: lastVectorRef.current.dy,
        shield: true,
        timestamp: now
      });
    }
  };

  const triggerPulse = () => {
    if (!myPlayer) return;
    const now = Date.now();
    if (now >= myPlayer.pulseCooldownUntil) {
      inputSeqRef.current += 1;
      onSendInput({
        seq: inputSeqRef.current,
        dx: lastVectorRef.current.dx,
        dy: lastVectorRef.current.dy,
        pulse: true,
        timestamp: now
      });
    }
  };

  // Setup Keyboard Listeners for Desktop Players
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.code;
      keysRef.current[key] = true;

      if (key === 'Space') {
        e.preventDefault();
        triggerDash();
      } else if (key === 'KeyQ') {
        triggerShield();
      } else if (key === 'KeyE') {
        triggerPulse();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [myPlayer]);

  // Movement input loop at ~30Hz
  useEffect(() => {
    const interval = setInterval(() => {
      let dx = 0;
      let dy = 0;

      // 1. Check Keyboard
      if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) dy -= 1;
      if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) dy += 1;
      if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) dx -= 1;
      if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) dx += 1;

      // 2. Override with Joystick if active
      if (joystickActive) {
        dx = joystickDelta.x;
        dy = joystickDelta.y;
      }

      // Normalize vector
      const mag = Math.hypot(dx, dy);
      if (mag > 0) {
        dx = dx / Math.max(1, mag);
        dy = dy / Math.max(1, mag);
      }

      lastVectorRef.current = { dx, dy };

      if (dx !== 0 || dy !== 0 || joystickActive) {
        inputSeqRef.current += 1;
        onSendInput({
          seq: inputSeqRef.current,
          dx,
          dy,
          timestamp: Date.now()
        });
      }
    }, 33);

    return () => clearInterval(interval);
  }, [joystickActive, joystickDelta]);

  // Touch joystick handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    setJoystickOrigin({ x, y });
    setJoystickDelta({ x: 0, y: 0 });
    setJoystickActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickActive) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;

    const diffX = currentX - joystickOrigin.x;
    const diffY = currentY - joystickOrigin.y;
    const dist = Math.hypot(diffX, diffY);
    const maxRadius = 60;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(diffY, diffX);

    setJoystickDelta({
      x: (Math.cos(angle) * clampedDist) / maxRadius,
      y: (Math.sin(angle) * clampedDist) / maxRadius
    });
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    setJoystickDelta({ x: 0, y: 0 });
    // Send stop input
    inputSeqRef.current += 1;
    onSendInput({
      seq: inputSeqRef.current,
      dx: 0,
      dy: 0,
      timestamp: Date.now()
    });
  };

  // Cooldown calculations
  const now = Date.now();
  const dashCdRemaining = myPlayer
    ? Math.max(0, (myPlayer.dashCooldownUntil - now) / 1000)
    : 0;
  const shieldCdRemaining = myPlayer
    ? Math.max(0, (myPlayer.shieldCooldownUntil - now) / 1000)
    : 0;
  const pulseCdRemaining = myPlayer
    ? Math.max(0, (myPlayer.pulseCooldownUntil - now) / 1000)
    : 0;

  // Rank sorting
  const rankedPlayers = Object.values(roomState.players).sort((a, b) => b.score - a.score);
  const myRank = rankedPlayers.findIndex(p => p.id === myPlayerId) + 1;

  // Match timer format
  const mins = Math.floor(Math.max(0, roomState.timeRemainingSec) / 60);
  const secs = Math.floor(Math.max(0, roomState.timeRemainingSec) % 60);
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 md:p-6 z-20">
      {/* Top HUD: Health, Match Timer, Score, Minimap */}
      <div className="flex items-start justify-between gap-3 w-full">
        {/* Left: Player Status Bar */}
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-xl p-2.5 px-3.5 shadow-lg shadow-cyan-950/40 pointer-events-auto">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm text-black border border-white/20 shadow-inner"
            style={{ backgroundColor: myPlayer?.color || charDef.primaryColor }}
          >
            {charDef.name.substring(0, 3)}
          </div>
          <div className="flex flex-col gap-1 min-w-[130px] md:min-w-[170px]">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white tracking-wider font-['Orbitron']">
                {myPlayer?.name || 'OPERATOR'}
              </span>
              <span className="text-cyan-400 font-mono font-bold">
                {myPlayer?.health || 0} / {myPlayer?.maxHealth || 100}
              </span>
            </div>
            {/* Health Bar */}
            <div className="w-full bg-slate-900/80 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${Math.max(0, Math.min(100, ((myPlayer?.health || 0) / (myPlayer?.maxHealth || 100)) * 100))}%`,
                  backgroundColor:
                    (myPlayer?.health || 0) > (myPlayer?.maxHealth || 100) * 0.5
                      ? '#00ff9d'
                      : (myPlayer?.health || 0) > (myPlayer?.maxHealth || 100) * 0.25
                      ? '#ffaa00'
                      : '#ff0055'
                }}
              />
            </div>
          </div>
        </div>

        {/* Center: Match Timer & Objective Score */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md border border-cyan-500/40 rounded-2xl px-5 py-1.5 shadow-lg shadow-cyan-500/20">
            <Clock className={`w-4 h-4 ${roomState.timeRemainingSec < 30 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
            <span
              className={`font-['Orbitron'] font-black tracking-widest text-lg md:text-xl ${
                roomState.timeRemainingSec < 30 ? 'text-red-400 animate-pulse' : 'text-white'
              }`}
            >
              {timeFormatted}
            </span>
          </div>

          {/* Quick Objective Pills */}
          <div className="flex items-center gap-3 mt-1.5 text-xs font-['Rajdhani'] font-bold text-slate-200 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 border border-slate-800">
            <div className="flex items-center gap-1 text-cyan-300">
              <Gem className="w-3.5 h-3.5" />
              <span>{myPlayer?.crystalsCollected || 0}</span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center gap-1 text-amber-300">
              <Flag className="w-3.5 h-3.5" />
              <span>{myPlayer?.zonesCapturedSec || 0}s</span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center gap-1 text-red-400">
              <Crosshair className="w-3.5 h-3.5" />
              <span>{myPlayer?.takedowns || 0}</span>
            </div>
          </div>
        </div>

        {/* Right: Scoreboard & Mini-Map */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Rank & Score Pill */}
          <div className="bg-black/60 backdrop-blur-md border border-violet-500/30 rounded-xl p-2 px-3 flex flex-col items-end">
            <div className="text-[10px] text-violet-400 uppercase tracking-widest font-bold">
              RANK #{myRank || 1} OF {rankedPlayers.length}
            </div>
            <div className="text-xl font-['Orbitron'] font-black text-amber-400">
              {myPlayer?.score || 0} <span className="text-xs text-amber-200">PTS</span>
            </div>
          </div>

          {/* Mini-map */}
          <div className="relative w-20 h-16 md:w-28 md:h-20 bg-slate-950/80 border border-cyan-500/40 rounded-xl overflow-hidden shadow-md flex items-center justify-center">
            {/* Zones on minimap */}
            {roomState.zones.map(z => (
              <div
                key={z.id}
                className="absolute w-3.5 h-3.5 rounded-full border border-white/40"
                style={{
                  left: `${(z.x / ARENA_WIDTH) * 100}%`,
                  top: `${(z.y / ARENA_HEIGHT) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: z.controllingPlayerId ? z.color : '#334466'
                }}
              />
            ))}

            {/* Players on minimap */}
            {Object.values(roomState.players).map(p => (
              <div
                key={p.id}
                className={`absolute rounded-full ${p.id === myPlayerId ? 'w-2.5 h-2.5 border border-white shadow-sm ring-1 ring-cyan-300' : 'w-1.5 h-1.5'}`}
                style={{
                  left: `${(p.x / ARENA_WIDTH) * 100}%`,
                  top: `${(p.y / ARENA_HEIGHT) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: p.id === myPlayerId ? '#ffffff' : p.color
                }}
              />
            ))}
          </div>

          {/* Forfeit / Leave Match */}
          <button
            onClick={onLeaveMatch}
            title="Leave Match"
            className="w-9 h-9 rounded-xl bg-red-950/60 hover:bg-red-800/80 text-red-400 border border-red-500/40 flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Alerts / Respawn Overlay */}
      {myPlayer && !myPlayer.isAlive && (
        <div className="self-center flex flex-col items-center bg-black/85 backdrop-blur-md border border-red-500/60 p-5 rounded-2xl shadow-2xl animate-pulse">
          <div className="text-red-500 font-['Orbitron'] font-black tracking-widest text-lg">
            SYSTEM CRITICAL // RESPAWNING IN
          </div>
          <div className="text-4xl font-['Orbitron'] font-black text-white mt-1">
            {Math.max(1, Math.ceil((myPlayer.respawnAt - now) / 1000))}s
          </div>
        </div>
      )}

      {/* Bottom Controls Area: Virtual Joystick (Left) and Abilities (Right) */}
      <div className="flex items-end justify-between w-full pb-2">
        {/* Virtual Joystick Touch Region (Left) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-40 h-40 md:w-52 md:h-52 relative flex items-center justify-center pointer-events-auto touch-none"
        >
          {/* Outer ring */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-cyan-500/30 bg-cyan-950/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-cyan-950/50">
            {/* Center thumb stick */}
            <div
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-400 shadow-md shadow-cyan-400/50 flex items-center justify-center transition-transform"
              style={{
                transform: `translate(${joystickDelta.x * 45}px, ${joystickDelta.y * 45}px)`
              }}
            >
              <div className="w-6 h-6 rounded-full border border-white/60 bg-white/20" />
            </div>
          </div>
          <span className="absolute bottom-1 text-[10px] text-cyan-400/60 font-mono tracking-wider">
            DRAG TO MOVE (WASD)
          </span>
        </div>

        {/* Ability Buttons (Right) */}
        <div className="flex items-center gap-3.5 md:gap-5 pointer-events-auto">
          {/* Dash Ability */}
          <button
            onClick={triggerDash}
            disabled={dashCdRemaining > 0}
            className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg ${
              dashCdRemaining > 0
                ? 'bg-slate-900/80 border border-slate-700/50 text-slate-500'
                : 'bg-gradient-to-br from-cyan-600 to-blue-700 border-2 border-cyan-300 text-white shadow-cyan-500/30'
            }`}
          >
            <Zap className="w-6 h-6 md:w-7 md:h-7" />
            <span className="text-[10px] font-bold tracking-wider mt-0.5 font-['Orbitron']">DASH</span>
            <span className="text-[9px] text-cyan-200/70 font-mono hidden md:block">[SPACE]</span>
            {dashCdRemaining > 0 && (
              <div className="absolute inset-0 bg-black/75 rounded-2xl flex items-center justify-center font-['Orbitron'] font-black text-white text-sm">
                {dashCdRemaining.toFixed(1)}s
              </div>
            )}
          </button>

          {/* Hardlight Shield Ability */}
          <button
            onClick={triggerShield}
            disabled={shieldCdRemaining > 0}
            className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg ${
              shieldCdRemaining > 0
                ? 'bg-slate-900/80 border border-slate-700/50 text-slate-500'
                : 'bg-gradient-to-br from-purple-600 to-indigo-700 border-2 border-purple-300 text-white shadow-purple-500/30'
            }`}
          >
            <Shield className="w-6 h-6 md:w-7 md:h-7" />
            <span className="text-[10px] font-bold tracking-wider mt-0.5 font-['Orbitron']">SHIELD</span>
            <span className="text-[9px] text-purple-200/70 font-mono hidden md:block">[Q]</span>
            {shieldCdRemaining > 0 && (
              <div className="absolute inset-0 bg-black/75 rounded-2xl flex items-center justify-center font-['Orbitron'] font-black text-white text-sm">
                {shieldCdRemaining.toFixed(1)}s
              </div>
            )}
          </button>

          {/* Energy Pulse Ability */}
          <button
            onClick={triggerPulse}
            disabled={pulseCdRemaining > 0}
            className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg ${
              pulseCdRemaining > 0
                ? 'bg-slate-900/80 border border-slate-700/50 text-slate-500'
                : 'bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-amber-300 text-white shadow-amber-500/30'
            }`}
          >
            <Radio className="w-6 h-6 md:w-7 md:h-7" />
            <span className="text-[10px] font-bold tracking-wider mt-0.5 font-['Orbitron']">PULSE</span>
            <span className="text-[9px] text-amber-200/70 font-mono hidden md:block">[E]</span>
            {pulseCdRemaining > 0 && (
              <div className="absolute inset-0 bg-black/75 rounded-2xl flex items-center justify-center font-['Orbitron'] font-black text-white text-sm">
                {pulseCdRemaining.toFixed(1)}s
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
