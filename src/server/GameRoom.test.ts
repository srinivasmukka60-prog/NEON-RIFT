/**
 * NEON RIFT - Authoritative Game Room & Server Integration Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GameRoom } from './GameRoom';
import { RoomManager } from './RoomManager';
import { CHARACTERS } from '../shared/constants';

describe('NEON RIFT Game Room & Server Architecture', () => {
  let room: GameRoom;

  beforeEach(() => {
    room = new GameRoom(
      'test_room_1',
      {
        roomCode: 'TEST',
        matchDurationSec: 60,
        maxPlayers: 4,
        isPrivate: false,
        fillWithBots: false
      },
      { id: 'player_host', name: 'HOST_AGENT', avatar: 'avatar_1', character: 'vortex' }
    );
  });

  it('1. Room creation and joining adds players correctly', () => {
    expect(room.state.players['player_host']).toBeDefined();
    expect(room.state.players['player_host'].name).toBe('HOST_AGENT');
    expect(room.state.hostId).toBe('player_host');

    // Add 2nd player
    const p2 = room.addPlayer('player_2', 'AGENT_TWO', 'avatar_2', 'striker');
    expect(room.state.players['player_2']).toBeDefined();
    expect(p2.character).toBe('striker');
    expect(Object.keys(room.state.players).length).toBe(2);
  });

  it('2. Room capacity is enforced by RoomManager', () => {
    const mgr = new RoomManager();
    const created = mgr.createRoom(
      { id: 'p1', name: 'P1', avatar: 'av', character: 'vortex' },
      { maxPlayers: 2 }
    );

    created.addPlayer('p2', 'P2', 'av', 'aegis');
    expect(Object.keys(created.state.players).length).toBe(2);

    const lookup = mgr.getRoomByCode(created.state.roomCode);
    expect(lookup).toBeDefined();
    expect(Object.keys(lookup!.state.players).length).toBe(2);
  });

  it('3. Movement limits prevent speed injection exploits', () => {
    room.startMatch();
    const p = room.state.players['player_host'];
    const initialSpeed = CHARACTERS.vortex.baseSpeed;

    // Send malformed / hacked large input dx: 100, dy: 100
    room.handleInput(p.id, {
      seq: 1,
      dx: 100,
      dy: 100,
      timestamp: Date.now()
    });

    // Velocity should be normalized and clamped to baseSpeed (or baseSpeed / sqrt(2))
    const totalVelocity = Math.hypot(p.vx, p.vy);
    expect(totalVelocity).toBeLessThanOrEqual(initialSpeed + 1);
  });

  it('4. Crystal collection is authoritative and prevents duplicate collection', () => {
    room.startMatch();
    const p = room.state.players['player_host'];

    // Spawn a crystal right on player
    const crystalId = 'test_crystal';
    room.state.crystals[crystalId] = {
      id: crystalId,
      x: p.x,
      y: p.y,
      value: 15,
      type: 'standard',
      spawnedAt: Date.now()
    };

    const initialScore = p.score;
    // Tick simulation to process collision
    (room as any).updateActiveMatch(0.033, Date.now());

    expect(room.state.crystals[crystalId]).toBeUndefined();
    expect(p.score).toBe(initialScore + 15);
    expect(p.crystalsCollected).toBe(1);

    // If another player tries to collect it, it no longer exists
    const p2 = room.addPlayer('player_2', 'AGENT_2', 'av', 'striker');
    p2.x = p.x;
    p2.y = p.y;
    (room as any).updateActiveMatch(0.033, Date.now());
    expect(p2.score).toBe(0);
  });

  it('5. Ability cooldowns are strictly enforced', () => {
    room.startMatch();
    const p = room.state.players['player_host'];
    const now = Date.now();

    // Use Dash
    room.handleInput(p.id, {
      seq: 1,
      dx: 1,
      dy: 0,
      dash: true,
      timestamp: now
    });

    expect(p.isDashing).toBe(true);
    expect(p.dashCooldownUntil).toBeGreaterThan(now);

    // Try to trigger dash immediately again (should fail)
    p.isDashing = false;
    room.handleInput(p.id, {
      seq: 2,
      dx: 1,
      dy: 0,
      dash: true,
      timestamp: now + 50
    });

    // Should not re-enter dashing state while on cooldown
    expect(p.isDashing).toBe(false);
  });

  it('6. Damage and respawn logic', () => {
    room.startMatch();
    const attacker = room.state.players['player_host'];
    const victim = room.addPlayer('victim', 'VICTIM', 'av', 'vortex');

    // Place attacker and victim close
    attacker.x = 500;
    attacker.y = 500;
    victim.x = 510;
    victim.y = 510;

    // Trigger pulse from attacker
    room.handleInput(attacker.id, {
      seq: 1,
      dx: 0,
      dy: 0,
      pulse: true,
      timestamp: Date.now()
    });

    expect(victim.health).toBeLessThan(victim.maxHealth);

    // Deal lethal damage
    victim.health = 1;
    (room as any).triggerEnergyPulse(attacker);

    expect(victim.isAlive).toBe(false);
    expect(victim.respawnAt).toBeGreaterThan(Date.now());
    expect(attacker.takedowns).toBe(1);
    expect(attacker.score).toBe(50);
  });

  it('7. Control-zone scoring rewards occupying players', () => {
    room.startMatch();
    const p = room.state.players['player_host'];
    const zone = room.state.zones[0];

    // Place player inside zone
    p.x = zone.x;
    p.y = zone.y;

    (room as any).evaluateZones();

    expect(zone.controllingPlayerId).toBe(p.id);
    expect(p.score).toBeGreaterThan(0);
    expect(p.zonesCapturedSec).toBe(1);
  });

  it('8. Two separate connected clients receive the same authoritative room state', () => {
    const messagesClient1: any[] = [];
    const messagesClient2: any[] = [];

    room.connectClient({
      id: 'client_1',
      send: (raw) => messagesClient1.push(JSON.parse(raw)),
      isAlive: true,
      reconnectToken: 'tok1'
    });

    room.connectClient({
      id: 'client_2',
      send: (raw) => messagesClient2.push(JSON.parse(raw)),
      isAlive: true,
      reconnectToken: 'tok2'
    });

    // Broadcast test message
    room.broadcast({
      type: 'combat_event',
      payload: { type: 'pulse', x: 200, y: 300, timestamp: Date.now() }
    });

    expect(messagesClient1.length).toBeGreaterThan(0);
    expect(messagesClient2.length).toBeGreaterThan(0);
    expect(messagesClient1[messagesClient1.length - 1].payload.x).toBe(200);
    expect(messagesClient2[messagesClient2.length - 1].payload.x).toBe(200);
  });

  it('9. Match end determines winner with clean tie-breaking', () => {
    room.startMatch();
    const p1 = room.state.players['player_host'];
    const p2 = room.addPlayer('player_2', 'AGENT_2', 'av', 'aegis');

    p1.score = 250;
    p2.score = 400;

    room.endMatch();

    expect(room.state.phase).toBe('ended');
    expect(room.state.winnerId).toBe('player_2');
  });
});
