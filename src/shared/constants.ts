/**
 * NEON RIFT - Constants & Game Tuning Rules
 */
import { CharacterDef, CharacterId, ArenaObstacle, ControlZoneState } from './types';

export const ARENA_WIDTH = 1800;
export const ARENA_HEIGHT = 1200;

export const SERVER_TICK_RATE = 30; // 30Hz server ticks
export const SERVER_TICK_MS = 1000 / SERVER_TICK_RATE;

export const DEFAULT_MATCH_DURATION_SEC = 180;
export const COUNTDOWN_DURATION_SEC = 3;
export const RESPAWN_DELAY_MS = 3000;
export const INVULNERABILITY_AFTER_RESPAWN_MS = 2500;
export const RECONNECTION_WINDOW_MS = 30000;

export const MAX_PLAYERS_PER_ROOM = 8;
export const MIN_PLAYERS_TO_START = 2;

export const CRYSTAL_SPAWN_INTERVAL_MS = 3000;
export const MAX_ACTIVE_CRYSTALS = 22;
export const STANDARD_CRYSTAL_POINTS = 15;
export const MEGA_CRYSTAL_POINTS = 45;
export const TAKEDOWN_POINTS = 50;
export const ZONE_POINTS_PER_SECOND = 10;

export const PLAYER_RADIUS = 26;
export const CRYSTAL_RADIUS = 16;

// 4 Distinct Original Heroes
export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  vortex: {
    id: 'vortex',
    name: 'VORTEX',
    tagline: 'Hyper-Kinetic Flux Runner',
    description: 'Ultra-agile scout engineered for blitz crystal harvesting and lightning-quick flanking.',
    primaryColor: '#00f5ff',
    accentColor: '#0077ff',
    glowColor: 'rgba(0, 245, 255, 0.6)',
    baseSpeed: 340,
    maxHealth: 90,
    dashCooldown: 3000,
    dashSpeed: 820,
    dashDuration: 220,
    shieldCooldown: 9000,
    shieldDuration: 2000,
    pulseCooldown: 6000,
    pulseRadius: 160,
    pulseDamage: 25,
    passiveBonus: '+15% Sprint Speed & Rapid Dash Recovery'
  },
  aegis: {
    id: 'aegis',
    name: 'AEGIS',
    tagline: 'Titan Hardlight Bulwark',
    description: 'Armored fortress capable of anchoring disputed control zones under heavy enemy fire.',
    primaryColor: '#bf55ec',
    accentColor: '#8e44ad',
    glowColor: 'rgba(191, 85, 236, 0.6)',
    baseSpeed: 290,
    maxHealth: 140,
    dashCooldown: 4500,
    dashSpeed: 650,
    dashDuration: 200,
    shieldCooldown: 7000,
    shieldDuration: 3500,
    pulseCooldown: 7000,
    pulseRadius: 180,
    pulseDamage: 20,
    passiveBonus: '+40% Max Health & Reinforced Long-Life Shield'
  },
  striker: {
    id: 'striker',
    name: 'STRIKER',
    tagline: 'High-Voltage Overcharger',
    description: 'Frontline combat specialist wielding amplified energy shockwaves to pulverize foes.',
    primaryColor: '#ffaa00',
    accentColor: '#ff4400',
    glowColor: 'rgba(255, 170, 0, 0.6)',
    baseSpeed: 310,
    maxHealth: 110,
    dashCooldown: 3800,
    dashSpeed: 720,
    dashDuration: 200,
    shieldCooldown: 8500,
    shieldDuration: 2200,
    pulseCooldown: 4500,
    pulseRadius: 210,
    pulseDamage: 45,
    passiveBonus: '+80% Shockwave Pulse Blast & Knockback Force'
  },
  phantom: {
    id: 'phantom',
    name: 'PHANTOM',
    tagline: 'Spectral Rift Infiltrator',
    description: 'Tactical phantom that slips past enemy crossfire and instantly secures objectives.',
    primaryColor: '#00ff9d',
    accentColor: '#00b86b',
    glowColor: 'rgba(0, 255, 157, 0.6)',
    baseSpeed: 325,
    maxHealth: 100,
    dashCooldown: 3200,
    dashSpeed: 900,
    dashDuration: 260,
    shieldCooldown: 8000,
    shieldDuration: 2400,
    pulseCooldown: 5500,
    pulseRadius: 175,
    pulseDamage: 30,
    passiveBonus: '+25% Crystal Pickup Radius & Extended Warp Dash'
  }
};

// Preset Player Colors
export const PLAYER_COLORS = [
  '#00f5ff', // Cyan
  '#bf55ec', // Violet
  '#ff007f', // Neon Magenta
  '#ffaa00', // Neon Amber
  '#00ff9d', // Neon Mint
  '#ffe600', // Electric Yellow
  '#39ff14', // Acid Green
  '#ff3b30'  // Crimson Laser
];

// Arena Obstacles Layout
export const ARENA_OBSTACLES: ArenaObstacle[] = [
  // Center Rift Pillars
  { id: 'pillar-c1', x: 740, y: 520, width: 60, height: 160, type: 'pillar' },
  { id: 'pillar-c2', x: 1000, y: 520, width: 60, height: 160, type: 'pillar' },
  // Northwest Corner Barriers
  { id: 'barrier-nw', x: 340, y: 260, width: 180, height: 40, type: 'barrier' },
  { id: 'pillar-nw', x: 340, y: 300, width: 40, height: 140, type: 'pillar' },
  // Northeast Corner Barriers
  { id: 'barrier-ne', x: 1280, y: 260, width: 180, height: 40, type: 'barrier' },
  { id: 'pillar-ne', x: 1420, y: 300, width: 40, height: 140, type: 'pillar' },
  // Southwest Corner Barriers
  { id: 'barrier-sw', x: 340, y: 900, width: 180, height: 40, type: 'barrier' },
  { id: 'pillar-sw', x: 340, y: 760, width: 40, height: 140, type: 'pillar' },
  // Southeast Corner Barriers
  { id: 'barrier-se', x: 1280, y: 900, width: 180, height: 40, type: 'barrier' },
  { id: 'pillar-se', x: 1420, y: 760, width: 40, height: 140, type: 'pillar' },
  // Center Top and Bottom Barriers
  { id: 'barrier-top', x: 800, y: 180, width: 200, height: 40, type: 'barrier' },
  { id: 'barrier-bot', x: 800, y: 980, width: 200, height: 40, type: 'barrier' }
];

// Strategic Control Zones
export const ARENA_ZONES: ControlZoneState[] = [
  {
    id: 'zone-alpha',
    name: 'ZONE ALPHA',
    x: 420,
    y: 600,
    radius: 130,
    controllingPlayerId: null,
    captureProgress: 0,
    color: '#00f5ff'
  },
  {
    id: 'zone-core',
    name: 'RIFT CORE',
    x: 900,
    y: 600,
    radius: 150,
    controllingPlayerId: null,
    captureProgress: 0,
    color: '#ffaa00'
  },
  {
    id: 'zone-omega',
    name: 'ZONE OMEGA',
    x: 1380,
    y: 600,
    radius: 130,
    controllingPlayerId: null,
    captureProgress: 0,
    color: '#bf55ec'
  }
];

// Spawn Points for up to 8 players around the edges
export const SPAWN_POINTS = [
  { x: 180, y: 180 },
  { x: 1620, y: 180 },
  { x: 180, y: 1020 },
  { x: 1620, y: 1020 },
  { x: 900, y: 120 },
  { x: 900, y: 1080 },
  { x: 140, y: 600 },
  { x: 1660, y: 600 }
];
