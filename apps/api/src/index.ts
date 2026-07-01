import http from 'http';
import { app } from './app';
import { env } from './config/env.config';
import { initSocket } from './socket';

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const PORT = env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`[Server]: CheckMate API is running on port ${PORT}`);
});
 
