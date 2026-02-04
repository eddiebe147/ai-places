/**
 * X-Place WebSocket Server
 * Entry point for the real-time canvas server
 */

import { createServer as createHttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from './config/index.js';
import { handleConnection } from './handlers/connection.js';
import { createRedisClients } from './services/redis.js';
import { setupSubscriber } from './pubsub/subscriber.js';

async function main() {
  console.log('Starting X-Place WebSocket Server...');

  // Create Redis clients
  const redis = await createRedisClients();
  console.log('Redis clients connected');

  // Create HTTP server for health checks
  const httpServer = createHttpServer((req, res) => {
    if (req.url === '/' || req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }));
      return;
    }

    if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        connections: clients.size,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      }));
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer });

  // Track connected clients: userId -> Set<WebSocket>
  const clients = new Map<string, Set<WebSocket>>();

  // Set up Redis pub/sub for horizontal scaling
  setupSubscriber(redis.subscriber, clients);

  // Handle new WebSocket connections
  wss.on('connection', (ws, req) => {
    handleConnection(ws, req, {
      redis: redis.client,
      publisher: redis.publisher,
      clients,
    });
  });

  // Start server
  httpServer.listen(config.port, () => {
    console.log(`WebSocket server listening on port ${config.port}`);
    console.log(`Health check: http://localhost:${config.port}/health`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');

    wss.close(() => {
      console.log('WebSocket server closed');
    });

    httpServer.close(() => {
      console.log('HTTP server closed');
    });

    await redis.client.quit();
    await redis.publisher.quit();
    await redis.subscriber.quit();
    console.log('Redis connections closed');

    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
