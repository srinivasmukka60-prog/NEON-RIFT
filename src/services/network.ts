/**
 * NEON RIFT - Network Client & Offline Simulation Driver
 * Handles live WebSockets, message dispatch, ping measurement, and local bot practice mode.
 */
import {
  ClientMessage,
  ServerMessage,
  RoomState,
  PlayerInput,
  CombatEvent,
  MatchResults,
  CharacterId
} from '../shared/types';
import { GameRoom } from '../server/GameRoom';
import { DEFAULT_MATCH_DURATION_SEC } from '../shared/constants';

type MessageListener = (msg: ServerMessage) => void;

class NetworkClient {
  private ws: WebSocket | null = null;
  private listeners: Set<MessageListener> = new Set();
  private localRoom: GameRoom | null = null;
  public isPracticeMode: boolean = false;
  public currentRoomState: RoomState | null = null;
  public myPlayerId: string = '';
  public pingMs: number = 0;
  private pingInterval: NodeJS.Timeout | null = null;

  public addListener(listener: MessageListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private dispatch(msg: ServerMessage) {
    if (msg.type === 'room_state_update') {
      this.currentRoomState = msg.payload;
    }
    this.listeners.forEach(fn => fn(msg));
  }

  public connect(): Promise<boolean> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.startPing();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data: ServerMessage = JSON.parse(event.data);
            if (data.type === 'pong') {
              const now = Date.now();
              this.pingMs = Math.max(0, now - (data.payload?.clientTime || now));
            } else {
              this.dispatch(data);
            }
          } catch (e) {
            console.error('Network parse error:', e);
          }
        };

        this.ws.onerror = () => {
          resolve(false);
        };

        this.ws.onclose = () => {
          this.stopPing();
        };
      } catch (err) {
        resolve(false);
      }
    });
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          payload: { clientTime: Date.now() }
        });
      }
    }, 2000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public send(msg: ClientMessage) {
    if (this.isPracticeMode && this.localRoom) {
      this.handleLocalInput(msg);
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  // Live Online Matchmaking
  public joinMatchmaking(player: { id: string; name: string; avatar: string; character: CharacterId }) {
    this.isPracticeMode = false;
    this.myPlayerId = player.id;
    this.send({
      type: 'join_matchmaking',
      payload: { player }
    });
  }

  // Create Private Room
  public createRoom(
    player: { id: string; name: string; avatar: string; character: CharacterId },
    config?: { matchDurationSec?: number; maxPlayers?: number; fillWithBots?: boolean }
  ) {
    this.isPracticeMode = false;
    this.myPlayerId = player.id;
    this.send({
      type: 'create_room',
      payload: {
        player,
        config: {
          isPrivate: true,
          matchDurationSec: config?.matchDurationSec || DEFAULT_MATCH_DURATION_SEC,
          maxPlayers: config?.maxPlayers || 4,
          fillWithBots: config?.fillWithBots ?? true
        }
      }
    });
  }

  // Join by Room Code
  public joinRoom(roomCode: string, player: { id: string; name: string; avatar: string; character: CharacterId }) {
    this.isPracticeMode = false;
    this.myPlayerId = player.id;
    this.send({
      type: 'join_room',
      payload: { roomCode, player }
    });
  }

  public toggleReady() {
    this.send({ type: 'toggle_ready', payload: {} });
  }

  public updateCharacter(character: CharacterId) {
    this.send({ type: 'update_character', payload: { character } });
  }

  public startMatch() {
    this.send({ type: 'start_match', payload: {} });
  }

  public sendInput(input: PlayerInput) {
    this.send({ type: 'input', payload: input });
  }

  public leaveRoom() {
    if (this.isPracticeMode) {
      this.stopPracticeMode();
    } else {
      this.send({ type: 'leave_room', payload: {} });
    }
    this.currentRoomState = null;
  }

  // Local Practice Mode (Instant offline simulation against 3 AI bots)
  public startPracticeMode(player: { id: string; name: string; avatar: string; character: CharacterId }) {
    this.isPracticeMode = true;
    this.myPlayerId = player.id;

    if (this.localRoom) {
      this.localRoom.destroy();
    }

    this.localRoom = new GameRoom(
      'practice_room',
      {
        roomCode: 'BOTS',
        matchDurationSec: 120,
        maxPlayers: 4,
        isPrivate: true,
        fillWithBots: true
      },
      player
    );

    // Mock client send loop
    this.localRoom.connectClient({
      id: player.id,
      send: (raw: string) => {
        try {
          const msg = JSON.parse(raw);
          this.dispatch(msg);
        } catch (e) {}
      },
      isAlive: true,
      reconnectToken: 'practice_token'
    });

    this.dispatch({
      type: 'joined_room',
      payload: {
        roomId: this.localRoom.id,
        roomCode: 'BOTS',
        state: this.localRoom.state
      }
    });

    // Auto start countdown
    this.localRoom.startCountdown();
  }

  private handleLocalInput(msg: ClientMessage) {
    if (!this.localRoom) return;

    if (msg.type === 'input') {
      this.localRoom.handleInput(this.myPlayerId, msg.payload);
    } else if (msg.type === 'start_match') {
      this.localRoom.startCountdown();
    }
  }

  public stopPracticeMode() {
    if (this.localRoom) {
      this.localRoom.destroy();
      this.localRoom = null;
    }
    this.isPracticeMode = false;
  }
}

export const network = new NetworkClient();
