import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import { env } from './config/env.config';

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

  io.on('connection', (socket) => {
    connectedCount++;
    console.log(`Socket connected: ${socket.id} (total: ${connectedCount})`);

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
