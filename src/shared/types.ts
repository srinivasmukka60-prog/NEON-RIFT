/**
 * NEON RIFT - Shared Types & Network Protocol
 */

export type CharacterId = 'vortex' | 'aegis' | 'striker' | 'phantom';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  tagline: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  baseSpeed: number;
  maxHealth: number;
  dashCooldown: number; // ms
  dashSpeed: number;
  dashDuration: number; // ms
  shieldCooldown: number; // ms
  shieldDuration: number; // ms
  pulseCooldown: number; // ms
  pulseRadius: number; // px
  pulseDamage: number;
  passiveBonus: string;
}

export interface PlayerInput {
  seq: number;
  dx: number; // -1 to 1 normalized
  dy: number; // -1 to 1 normalized
  dash?: boolean;
  shield?: boolean;
  pulse?: boolean;
  timestamp: number;
}

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  character: CharacterId;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  maxHealth: number;
  score: number;
  crystalsCollected: number;
  zonesCapturedSec: number;
  takedowns: number;
  isReady: boolean;
  isAlive: boolean;
  isInvulnerable: boolean;
  invulnerableUntil: number;
  respawnAt: number;
  isShieldActive: boolean;
  shieldUntil: number;
  isDashing: boolean;
  dashUntil: number;
  dashCooldownUntil: number;
  shieldCooldownUntil: number;
  pulseCooldownUntil: number;
  isBot: boolean;
  ping: number;
  connected: boolean;
  lastInputSeq: number;
}

export interface CrystalState {
  id: string;
  x: number;
  y: number;
  value: number; // standard (10) or mega (30)
  type: 'standard' | 'mega';
  spawnedAt: number;
}

export interface ControlZoneState {
  id: string;
  x: number;
  y: number;
  radius: number;
  name: string;
  controllingPlayerId: string | null;
  captureProgress: number; // 0 to 100
  color: string;
}

export interface ArenaObstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'barrier' | 'pillar' | 'rift';
}

export type MatchPhase = 'waiting' | 'countdown' | 'active' | 'ended';

export interface RoomConfig {
  roomCode: string;
  matchDurationSec: number;
  maxPlayers: number;
  isPrivate: boolean;
  fillWithBots: boolean;
}

export interface RoomState {
  roomId: string;
  roomCode: string;
  hostId: string;
  phase: MatchPhase;
  countdownRemaining: number;
  timeRemainingSec: number;
  players: Record<string, PlayerState>;
  crystals: Record<string, CrystalState>;
  zones: ControlZoneState[];
  obstacles: ArenaObstacle[];
  config: RoomConfig;
  winnerId: string | null;
  serverTime: number;
}

export interface MatchResultPlayer {
  id: string;
  name: string;
  avatar: string;
  character: CharacterId;
  color: string;
  score: number;
  crystalsCollected: number;
  zonesCapturedSec: number;
  takedowns: number;
  rank: number;
  xpEarned: number;
  isBot: boolean;
}

export interface MatchResults {
  matchId: string;
  roomCode: string;
  durationSec: number;
  timestamp: number;
  players: MatchResultPlayer[];
  winner: MatchResultPlayer | null;
}

export interface CombatEvent {
  type: 'damage' | 'takedown' | 'pulse' | 'dash' | 'crystal' | 'zone_captured';
  sourcePlayerId?: string;
  targetPlayerId?: string;
  value?: number;
  x?: number;
  y?: number;
  timestamp: number;
}

// Network Message Enums & Payloads
export type ClientMessageType =
  | 'join_matchmaking'
  | 'create_room'
  | 'join_room'
  | 'leave_room'
  | 'toggle_ready'
  | 'update_character'
  | 'start_match'
  | 'input'
  | 'ping'
  | 'reconnect';

export type ServerMessageType =
  | 'joined_room'
  | 'room_state_update'
  | 'combat_event'
  | 'match_countdown'
  | 'match_start'
  | 'match_ended'
  | 'player_joined'
  | 'player_left'
  | 'error'
  | 'pong';

export interface ClientMessage {
  type: ClientMessageType;
  payload: any;
}

export interface ServerMessage {
  type: ServerMessageType;
  payload: any;
}
