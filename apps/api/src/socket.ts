import { Server as SocketIOServer, Socket } from 'socket.io';
import http from 'http';
import { env } from './config/env.config';
import { startMatchmakingLoop, registerMatchmakingHandlers } from './socket/handlers/matchmaking.handler';
import { registerGameHandlers } from './socket/handlers/game.handler';

let io: SocketIOServer;
let connectedCount = 0;

export const initSocket = (server: http.Server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  startMatchmakingLoop(io);

  io.on('connection', (socket: Socket) => {
    connectedCount++;
    console.log(`Socket connected: ${socket.id} (total: ${connectedCount})`);

    registerMatchmakingHandlers(socket);
    registerGameHandlers(io!, socket);

    socket.on('disconnect', () => {
      connectedCount = Math.max(0, connectedCount - 1);
      console.log(`Socket disconnected: ${socket.id} (total: ${connectedCount})`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/** Returns the number of currently connected socket clients (live presence count) */
export const getActiveCount = (): number => connectedCount;
