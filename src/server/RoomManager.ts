/**
 * NEON RIFT - Room Manager & Public Matchmaking Service
 */
import { GameRoom } from './GameRoom';
import { RoomConfig, CharacterId } from '../shared/types';
import { DEFAULT_MATCH_DURATION_SEC, MAX_PLAYERS_PER_ROOM } from '../shared/constants';

function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
}

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  private codeToRoomId: Map<string, string> = new Map();

  public createRoom(
    hostPlayer: { id: string; name: string; avatar: string; character: CharacterId },
    customConfig?: Partial<RoomConfig>
  ): GameRoom {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let roomCode = generateRoomCode();
    while (this.codeToRoomId.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const config: RoomConfig = {
      roomCode,
      matchDurationSec: customConfig?.matchDurationSec || DEFAULT_MATCH_DURATION_SEC,
      maxPlayers: customConfig?.maxPlayers || MAX_PLAYERS_PER_ROOM,
      isPrivate: customConfig?.isPrivate || false,
      fillWithBots: customConfig?.fillWithBots ?? true
    };

    const room = new GameRoom(roomId, config, hostPlayer);
    this.rooms.set(roomId, room);
    this.codeToRoomId.set(roomCode, roomId);

    room.setOnEmpty(() => {
      this.destroyRoom(roomId);
    });

    return room;
  }

  public findOrCreateMatchmakingRoom(player: {
    id: string;
    name: string;
    avatar: string;
    character: CharacterId;
  }): GameRoom {
    // Look for an available public room in 'waiting' phase
    for (const room of this.rooms.values()) {
      if (!room.state.config.isPrivate && room.state.phase === 'waiting') {
        const playerCount = Object.keys(room.state.players).length;
        if (playerCount < room.state.config.maxPlayers) {
          room.addPlayer(player.id, player.name, player.avatar, player.character, false);
          return room;
        }
      }
    }

    // No open public room found, create one
    return this.createRoom(player, {
      isPrivate: false,
      matchDurationSec: DEFAULT_MATCH_DURATION_SEC,
      maxPlayers: 4,
      fillWithBots: true
    });
  }

  public getRoomById(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomByCode(code: string): GameRoom | undefined {
    const roomId = this.codeToRoomId.get(code.toUpperCase());
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  public destroyRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      this.codeToRoomId.delete(room.state.roomCode);
      room.destroy();
      this.rooms.delete(roomId);
    }
  }

  public getStats() {
    return {
      activeRooms: this.rooms.size,
      totalPlayers: Array.from(this.rooms.values()).reduce(
        (sum, r) => sum + Object.keys(r.state.players).length,
        0
      )
    };
  }
}

export const roomManager = new RoomManager();
