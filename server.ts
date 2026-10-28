/**
 * NEON RIFT - Unified Full-Stack Server
 * Express + WebSocket Transport + Vite Middlewares on Port 3000
 */
import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { roomManager } from './src/server/RoomManager';
import { ClientMessage, ServerMessage } from './src/shared/types';
import { CHARACTERS } from './src/shared/constants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json());

  // Health and Status API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      name: 'NEON RIFT Game Server',
      stats: roomManager.getStats(),
      timestamp: Date.now()
    });
  });

  // WebSocket Server attached to same HTTP port
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (data: Buffer | string) => {
      try {
        const msg: ClientMessage = JSON.parse(data.toString());

        switch (msg.type) {
          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong', payload: { clientTime: msg.payload?.clientTime, serverTime: Date.now() } }));
            break;
          }

          case 'join_matchmaking': {
            const { player } = msg.payload;
            currentPlayerId = player.id;
            const room = roomManager.findOrCreateMatchmakingRoom(player);
            currentRoomId = room.id;

            room.connectClient({
              id: player.id,
              send: (raw) => ws.send(raw),
              isAlive: true,
              reconnectToken: `${player.id}_${Date.now()}`
            });

            ws.send(JSON.stringify({
              type: 'joined_room',
              payload: {
                roomId: room.id,
                roomCode: room.state.roomCode,
                state: room.state
              }
            }));
            break;
          }

          case 'create_room': {
            const { player, config } = msg.payload;
            currentPlayerId = player.id;
            const room = roomManager.createRoom(player, config);
            currentRoomId = room.id;

            room.connectClient({
              id: player.id,
              send: (raw) => ws.send(raw),
              isAlive: true,
              reconnectToken: `${player.id}_${Date.now()}`
            });

            ws.send(JSON.stringify({
              type: 'joined_room',
              payload: {
                roomId: room.id,
                roomCode: room.state.roomCode,
                state: room.state
              }
            }));
            break;
          }

          case 'join_room': {
            const { roomCode, player } = msg.payload;
            const room = roomManager.getRoomByCode(roomCode);
            if (!room) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: `Room '${roomCode}' not found or match finished.` }
              }));
              return;
            }

            if (Object.keys(room.state.players).length >= room.state.config.maxPlayers) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: `Room '${roomCode}' is full.` }
              }));
              return;
            }

            currentPlayerId = player.id;
            currentRoomId = room.id;
            room.addPlayer(player.id, player.name, player.avatar, player.character, false);

            room.connectClient({
              id: player.id,
              send: (raw) => ws.send(raw),
              isAlive: true,
              reconnectToken: `${player.id}_${Date.now()}`
            });

            ws.send(JSON.stringify({
              type: 'joined_room',
              payload: {
                roomId: room.id,
                roomCode: room.state.roomCode,
                state: room.state
              }
            }));
            break;
          }

          case 'toggle_ready': {
            if (!currentRoomId || !currentPlayerId) return;
            const room = roomManager.getRoomById(currentRoomId);
            if (room && room.state.players[currentPlayerId]) {
              room.state.players[currentPlayerId].isReady = !room.state.players[currentPlayerId].isReady;
              room.broadcast({
                type: 'room_state_update',
                payload: room.state
              });
            }
            break;
          }

          case 'update_character': {
            if (!currentRoomId || !currentPlayerId) return;
            const room = roomManager.getRoomById(currentRoomId);
            const { character } = msg.payload;
            if (room && room.state.players[currentPlayerId] && CHARACTERS[character as keyof typeof CHARACTERS]) {
              room.state.players[currentPlayerId].character = character;
              const charDef = CHARACTERS[character as keyof typeof CHARACTERS];
              room.state.players[currentPlayerId].health = charDef.maxHealth;
              room.state.players[currentPlayerId].maxHealth = charDef.maxHealth;
              room.broadcast({
                type: 'room_state_update',
                payload: room.state
              });
            }
            break;
          }

          case 'start_match': {
            if (!currentRoomId || !currentPlayerId) return;
            const room = roomManager.getRoomById(currentRoomId);
            if (room && room.state.hostId === currentPlayerId && room.state.phase === 'waiting') {
              room.startCountdown();
            }
            break;
          }

          case 'input': {
            if (!currentRoomId || !currentPlayerId) return;
            const room = roomManager.getRoomById(currentRoomId);
            if (room) {
              room.handleInput(currentPlayerId, msg.payload);
            }
            break;
          }

          case 'leave_room': {
            if (currentRoomId && currentPlayerId) {
              const room = roomManager.getRoomById(currentRoomId);
              if (room) {
                room.disconnectClient(currentPlayerId);
              }
              currentRoomId = null;
              currentPlayerId = null;
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && currentPlayerId) {
        const room = roomManager.getRoomById(currentRoomId);
        if (room) {
          room.disconnectClient(currentPlayerId);
        }
      }
    });
  });

  // Vite middleware in dev or static files in production
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[NEON RIFT] Server listening on port ${PORT} (devMode=${!isProd})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start NEON RIFT server:', err);
  process.exit(1);
});
