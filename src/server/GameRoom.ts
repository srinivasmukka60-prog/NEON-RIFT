/**
 * NEON RIFT - Authoritative Game Room
 * High-frequency 30Hz server-authoritative physics, collision, abilities, and scoring.
 */
import {
  RoomState,
  RoomConfig,
  PlayerState,
  PlayerInput,
  CrystalState,
  CombatEvent,
  MatchResults,
  MatchResultPlayer,
  CharacterId,
  ServerMessage
} from '../shared/types';
import {
  ARENA_WIDTH,
  ARENA_HEIGHT,
  SERVER_TICK_RATE,
  SERVER_TICK_MS,
  CHARACTERS,
  ARENA_OBSTACLES,
  ARENA_ZONES,
  SPAWN_POINTS,
  PLAYER_RADIUS,
  CRYSTAL_RADIUS,
  CRYSTAL_SPAWN_INTERVAL_MS,
  MAX_ACTIVE_CRYSTALS,
  STANDARD_CRYSTAL_POINTS,
  MEGA_CRYSTAL_POINTS,
  TAKEDOWN_POINTS,
  ZONE_POINTS_PER_SECOND,
  RESPAWN_DELAY_MS,
  INVULNERABILITY_AFTER_RESPAWN_MS,
  PLAYER_COLORS
} from '../shared/constants';

interface ConnectedClient {
  id: string;
  send: (data: string) => void;
  isAlive: boolean;
  reconnectToken: string;
  disconnectTimeout?: NodeJS.Timeout;
}

export class GameRoom {
  public id: string;
  public state: RoomState;
  public clients: Map<string, ConnectedClient> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private crystalSpawnTimer: number = 0;
  private zonePointTimer: number = 0;
  private lastTickTime: number = Date.now();
  private onRoomEmptyCallback?: () => void;

  constructor(roomId: string, config: RoomConfig, hostPlayer: { id: string; name: string; avatar: string; character: CharacterId }) {
    this.id = roomId;
    this.state = {
      roomId,
      roomCode: config.roomCode,
      hostId: hostPlayer.id,
      phase: 'waiting',
      countdownRemaining: 3,
      timeRemainingSec: config.matchDurationSec,
      players: {},
      crystals: {},
      zones: JSON.parse(JSON.stringify(ARENA_ZONES)),
      obstacles: ARENA_OBSTACLES,
      config,
      winnerId: null,
      serverTime: Date.now()
    };

    // Add host player
    this.addPlayer(hostPlayer.id, hostPlayer.name, hostPlayer.avatar, hostPlayer.character, false);

    // Initial crystals
    for (let i = 0; i < 10; i++) {
      this.spawnCrystal();
    }
  }

  public setOnEmpty(cb: () => void) {
    this.onRoomEmptyCallback = cb;
  }

  public addPlayer(
    id: string,
    name: string,
    avatar: string,
    character: CharacterId,
    isBot: boolean = false
  ): PlayerState {
    const charDef = CHARACTERS[character] || CHARACTERS.vortex;
    const spawnIndex = Object.keys(this.state.players).length % SPAWN_POINTS.length;
    const spawn = SPAWN_POINTS[spawnIndex];
    const colorIndex = Object.keys(this.state.players).length % PLAYER_COLORS.length;

    const player: PlayerState = {
      id,
      name,
      avatar,
      character,
      color: PLAYER_COLORS[colorIndex],
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      angle: 0,
      health: charDef.maxHealth,
      maxHealth: charDef.maxHealth,
      score: 0,
      crystalsCollected: 0,
      zonesCapturedSec: 0,
      takedowns: 0,
      isReady: isBot, // Bots are immediately ready
      isAlive: true,
      isInvulnerable: false,
      invulnerableUntil: 0,
      respawnAt: 0,
      isShieldActive: false,
      shieldUntil: 0,
      isDashing: false,
      dashUntil: 0,
      dashCooldownUntil: 0,
      shieldCooldownUntil: 0,
      pulseCooldownUntil: 0,
      isBot,
      ping: 0,
      connected: true,
      lastInputSeq: 0
    };

    this.state.players[id] = player;
    return player;
  }

  public connectClient(client: ConnectedClient) {
    this.clients.set(client.id, client);
    if (this.state.players[client.id]) {
      this.state.players[client.id].connected = true;
    }
    this.broadcast({
      type: 'player_joined',
      payload: { player: this.state.players[client.id] }
    });
  }

  public disconnectClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      if (this.state.players[clientId]) {
        this.state.players[clientId].connected = false;
      }
      this.broadcast({
        type: 'player_left',
        payload: { playerId: clientId }
      });
    }

    // Check if empty
    const activeHumanCount = Array.from(this.clients.values()).length;
    if (activeHumanCount === 0) {
      this.destroy();
      this.onRoomEmptyCallback?.();
    }
  }

  public handleInput(playerId: string, input: PlayerInput) {
    const player = this.state.players[playerId];
    if (!player || !player.isAlive || this.state.phase !== 'active') return;

    const now = Date.now();
    player.lastInputSeq = input.seq;

    // Normalize dx, dy to clamp speed injection exploits
    let dx = Math.max(-1, Math.min(1, input.dx || 0));
    let dy = Math.max(-1, Math.min(1, input.dy || 0));
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 1) {
      dx /= mag;
      dy /= mag;
    }

    if (mag > 0.05) {
      player.angle = Math.atan2(dy, dx);
    }

    const charDef = CHARACTERS[player.character] || CHARACTERS.vortex;

    // Handle Dash Ability
    if (input.dash && now >= player.dashCooldownUntil && !player.isDashing) {
      player.isDashing = true;
      player.dashUntil = now + charDef.dashDuration;
      player.dashCooldownUntil = now + charDef.dashCooldown;
      this.broadcastCombatEvent({
        type: 'dash',
        sourcePlayerId: player.id,
        x: player.x,
        y: player.y,
        timestamp: now
      });
    }

    // Handle Shield Ability
    if (input.shield && now >= player.shieldCooldownUntil && !player.isShieldActive) {
      player.isShieldActive = true;
      player.shieldUntil = now + charDef.shieldDuration;
      player.shieldCooldownUntil = now + charDef.shieldCooldown;
    }

    // Handle Pulse Ability
    if (input.pulse && now >= player.pulseCooldownUntil) {
      player.pulseCooldownUntil = now + charDef.pulseCooldown;
      this.triggerEnergyPulse(player);
    }

    // Calculate velocity based on speed and dash status
    const currentSpeed = player.isDashing ? charDef.dashSpeed : charDef.baseSpeed;
    player.vx = dx * currentSpeed;
    player.vy = dy * currentSpeed;
  }

  private triggerEnergyPulse(source: PlayerState) {
    const now = Date.now();
    const charDef = CHARACTERS[source.character] || CHARACTERS.vortex;
    const radius = charDef.pulseRadius;
    const damage = charDef.pulseDamage;

    this.broadcastCombatEvent({
      type: 'pulse',
      sourcePlayerId: source.id,
      value: radius,
      x: source.x,
      y: source.y,
      timestamp: now
    });

    // Check all other players in blast zone
    for (const targetId in this.state.players) {
      if (targetId === source.id) continue;
      const target = this.state.players[targetId];
      if (!target.isAlive || target.isInvulnerable) continue;

      const dist = Math.hypot(target.x - source.x, target.y - source.y);
      if (dist <= radius + PLAYER_RADIUS) {
        // If shielded, absorb pulse without damage
        if (target.isShieldActive) {
          continue;
        }

        // Apply damage & knockback
        target.health -= damage;
        const knockAngle = Math.atan2(target.y - source.y, target.x - source.x);
        target.vx += Math.cos(knockAngle) * 400;
        target.vy += Math.sin(knockAngle) * 400;

        this.broadcastCombatEvent({
          type: 'damage',
          sourcePlayerId: source.id,
          targetPlayerId: target.id,
          value: damage,
          x: target.x,
          y: target.y,
          timestamp: now
        });

        if (target.health <= 0) {
          this.handleTakedown(source, target);
        }
      }
    }
  }

  private handleTakedown(killer: PlayerState, victim: PlayerState) {
    const now = Date.now();
    victim.health = 0;
    victim.isAlive = false;
    victim.respawnAt = now + RESPAWN_DELAY_MS;
    victim.isShieldActive = false;
    victim.isDashing = false;

    killer.takedowns += 1;
    killer.score += TAKEDOWN_POINTS;

    this.broadcastCombatEvent({
      type: 'takedown',
      sourcePlayerId: killer.id,
      targetPlayerId: victim.id,
      value: TAKEDOWN_POINTS,
      x: victim.x,
      y: victim.y,
      timestamp: now
    });
  }

  public startCountdown() {
    this.state.phase = 'countdown';
    this.state.countdownRemaining = 3;
    this.lastTickTime = Date.now();

    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      this.state.countdownRemaining = count;
      this.broadcast({
        type: 'match_countdown',
        payload: { count }
      });

      if (count <= 0) {
        clearInterval(timer);
        this.startMatch();
      }
    }, 1000);
  }

  public startMatch() {
    this.state.phase = 'active';
    this.state.timeRemainingSec = this.state.config.matchDurationSec;
    this.lastTickTime = Date.now();

    // If configured to fill with bots and we have fewer than max players, add bots
    if (this.state.config.fillWithBots) {
      const needed = Math.min(this.state.config.maxPlayers, 4) - Object.keys(this.state.players).length;
      const botNames = ['NEXUS_AI', 'CYBER_VIPER', 'NEON_BLADE', 'SYNTH_SHADOW'];
      const botChars: CharacterId[] = ['striker', 'vortex', 'aegis', 'phantom'];

      for (let i = 0; i < needed; i++) {
        const botId = `bot_${Date.now()}_${i}`;
        this.addPlayer(botId, botNames[i % botNames.length], 'avatar_2', botChars[i % botChars.length], true);
      }
    }

    this.broadcast({
      type: 'match_start',
      payload: { timeRemainingSec: this.state.timeRemainingSec }
    });

    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.tick(), SERVER_TICK_MS);
    }
  }

  private tick() {
    const now = Date.now();
    const dt = Math.min((now - this.lastTickTime) / 1000, 0.1);
    this.lastTickTime = now;
    this.state.serverTime = now;

    if (this.state.phase === 'active') {
      this.updateActiveMatch(dt, now);
    }

    // Broadcast state update
    this.broadcast({
      type: 'room_state_update',
      payload: this.state
    });
  }

  private updateActiveMatch(dt: number, now: number) {
    // 1. Update Match Timer
    this.state.timeRemainingSec -= dt;
    if (this.state.timeRemainingSec <= 0) {
      this.state.timeRemainingSec = 0;
      this.endMatch();
      return;
    }

    // 2. Crystal Spawning
    this.crystalSpawnTimer += dt * 1000;
    if (
      this.crystalSpawnTimer >= CRYSTAL_SPAWN_INTERVAL_MS &&
      Object.keys(this.state.crystals).length < MAX_ACTIVE_CRYSTALS
    ) {
      this.crystalSpawnTimer = 0;
      this.spawnCrystal();
    }

    // 3. Control Zone Scoring (every 1 second)
    this.zonePointTimer += dt;
    if (this.zonePointTimer >= 1.0) {
      this.zonePointTimer = 0;
      this.evaluateZones();
    }

    // 4. Update Bots
    this.updateBotBehaviors(dt, now);

    // 5. Update Players
    for (const playerId in this.state.players) {
      const p = this.state.players[playerId];

      // Respawn timer
      if (!p.isAlive) {
        if (now >= p.respawnAt) {
          p.isAlive = true;
          p.health = p.maxHealth;
          p.isInvulnerable = true;
          p.invulnerableUntil = now + INVULNERABILITY_AFTER_RESPAWN_MS;
          // Respawn at safe point
          const randomSpawn = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
          p.x = randomSpawn.x;
          p.y = randomSpawn.y;
          p.vx = 0;
          p.vy = 0;
        }
        continue;
      }

      // Check ability expirations
      if (p.isDashing && now >= p.dashUntil) {
        p.isDashing = false;
      }
      if (p.isShieldActive && now >= p.shieldUntil) {
        p.isShieldActive = false;
      }
      if (p.isInvulnerable && now >= p.invulnerableUntil) {
        p.isInvulnerable = false;
      }

      // Physics integration
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Obstacle collision resolution (circle vs AABB)
      this.resolveObstacleCollisions(p);

      // Arena boundary clamp
      p.x = Math.max(PLAYER_RADIUS, Math.min(ARENA_WIDTH - PLAYER_RADIUS, p.x));
      p.y = Math.max(PLAYER_RADIUS, Math.min(ARENA_HEIGHT - PLAYER_RADIUS, p.y));

      // Crystal collision check (authoritative atomic collection)
      for (const crystalId in this.state.crystals) {
        const c = this.state.crystals[crystalId];
        const dist = Math.hypot(p.x - c.x, p.y - c.y);
        if (dist <= PLAYER_RADIUS + CRYSTAL_RADIUS) {
          delete this.state.crystals[crystalId];
          const points = c.type === 'mega' ? MEGA_CRYSTAL_POINTS : STANDARD_CRYSTAL_POINTS;
          p.score += points;
          p.crystalsCollected += 1;

          this.broadcastCombatEvent({
            type: 'crystal',
            sourcePlayerId: p.id,
            value: points,
            x: c.x,
            y: c.y,
            timestamp: now
          });
        }
      }
    }
  }

  private resolveObstacleCollisions(p: PlayerState) {
    for (const obs of this.state.obstacles) {
      // Find closest point on obstacle rectangle
      const closestX = Math.max(obs.x, Math.min(p.x, obs.x + obs.width));
      const closestY = Math.max(obs.y, Math.min(p.y, obs.y + obs.height));

      const distX = p.x - closestX;
      const distY = p.y - closestY;
      const distance = Math.hypot(distX, distY);

      if (distance < PLAYER_RADIUS && distance > 0.0001) {
        const overlap = PLAYER_RADIUS - distance;
        p.x += (distX / distance) * overlap;
        p.y += (distY / distance) * overlap;
      }
    }
  }

  private evaluateZones() {
    for (const zone of this.state.zones) {
      // Find players in zone
      const playersInZone = Object.values(this.state.players).filter(
        p => p.isAlive && Math.hypot(p.x - zone.x, p.y - zone.y) <= zone.radius
      );

      if (playersInZone.length === 1) {
        const occupier = playersInZone[0];
        zone.controllingPlayerId = occupier.id;
        zone.color = occupier.color;
        zone.captureProgress = 100;
        occupier.score += ZONE_POINTS_PER_SECOND;
        occupier.zonesCapturedSec += 1;
      } else if (playersInZone.length > 1) {
        // Disputed zone
        zone.controllingPlayerId = null;
      }
    }
  }

  private updateBotBehaviors(dt: number, now: number) {
    const bots = Object.values(this.state.players).filter(p => p.isBot && p.isAlive);

    for (const bot of bots) {
      // 1. Target either closest crystal or control zone
      let targetX = ARENA_WIDTH / 2;
      let targetY = ARENA_HEIGHT / 2;
      let closestDist = Infinity;

      // Prefer mega crystals
      for (const cid in this.state.crystals) {
        const c = this.state.crystals[cid];
        const dist = Math.hypot(bot.x - c.x, bot.y - c.y);
        const weight = c.type === 'mega' ? 0.5 : 1.0;
        if (dist * weight < closestDist) {
          closestDist = dist * weight;
          targetX = c.x;
          targetY = c.y;
        }
      }

      // If no close crystals, target nearest control zone
      if (closestDist > 600) {
        const targetZone = this.state.zones[Math.floor(Math.random() * this.state.zones.length)];
        targetX = targetZone.x;
        targetY = targetZone.y;
      }

      // Check if nearby human player to use pulse ability
      const nearbyEnemies = Object.values(this.state.players).filter(
        other => other.id !== bot.id && other.isAlive && Math.hypot(bot.x - other.x, bot.y - other.y) < 180
      );

      const dx = targetX - bot.x;
      const dy = targetY - bot.y;
      const mag = Math.hypot(dx, dy) || 1;

      const input: PlayerInput = {
        seq: bot.lastInputSeq + 1,
        dx: dx / mag,
        dy: dy / mag,
        dash: Math.random() < 0.03 && closestDist > 200,
        shield: nearbyEnemies.length > 0 && Math.random() < 0.05,
        pulse: nearbyEnemies.length > 0,
        timestamp: now
      };

      this.handleInput(bot.id, input);
    }
  }

  private spawnCrystal() {
    const isMega = Math.random() < 0.25;
    const margin = 80;
    let x = margin + Math.random() * (ARENA_WIDTH - margin * 2);
    let y = margin + Math.random() * (ARENA_HEIGHT - margin * 2);

    const id = `c_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.state.crystals[id] = {
      id,
      x,
      y,
      value: isMega ? MEGA_CRYSTAL_POINTS : STANDARD_CRYSTAL_POINTS,
      type: isMega ? 'mega' : 'standard',
      spawnedAt: Date.now()
    };
  }

  public endMatch() {
    if (this.state.phase === 'ended') return;
    this.state.phase = 'ended';

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Rank players by score descending (tie-breaker: crystals collected, then takedowns)
    const rankedList = Object.values(this.state.players).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.crystalsCollected !== a.crystalsCollected) return b.crystalsCollected - a.crystalsCollected;
      return b.takedowns - a.takedowns;
    });

    const resultPlayers: MatchResultPlayer[] = rankedList.map((p, index) => {
      const isWinner = index === 0;
      const xp = Math.floor(p.score * 1.5 + (isWinner ? 250 : 80));
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        character: p.character,
        color: p.color,
        score: p.score,
        crystalsCollected: p.crystalsCollected,
        zonesCapturedSec: p.zonesCapturedSec,
        takedowns: p.takedowns,
        rank: index + 1,
        xpEarned: xp,
        isBot: p.isBot
      };
    });

    const winner = resultPlayers[0] || null;
    this.state.winnerId = winner?.id || null;

    const matchResults: MatchResults = {
      matchId: `match_${this.id}_${Date.now()}`,
      roomCode: this.state.roomCode,
      durationSec: this.state.config.matchDurationSec,
      timestamp: Date.now(),
      players: resultPlayers,
      winner
    };

    this.broadcast({
      type: 'match_ended',
      payload: matchResults
    });
  }

  public broadcastCombatEvent(event: CombatEvent) {
    this.broadcast({
      type: 'combat_event',
      payload: event
    });
  }

  public broadcast(msg: ServerMessage) {
    const raw = JSON.stringify(msg);
    this.clients.forEach(c => {
      try {
        c.send(raw);
      } catch (err) {}
    });
  }

  public destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.clients.clear();
  }
}
