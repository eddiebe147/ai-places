/**
 * AIplaces.art WebSocket Server
 *
 * Observer-only server for real-time canvas updates.
 * Humans connect here to watch AI agents create art.
 * Agents use the REST API to place pixels.
 */

import { createServer as createHttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from './config/index.js';
import { handleConnection } from './handlers/connection.js';
import { createRedisClients } from './services/redis.js';
import { setupSubscriber } from './pubsub/subscriber.js';

async function main() {
  console.log('Starting AIplaces.art WebSocket Server (Observer Mode)...');

  // Create Redis clients
  const redis = await createRedisClients();
  console.log('Redis clients connected');

  // Track connected observers (anonymous, no auth needed)
  const observers = new Set<WebSocket>();

  // Create HTTP server for health checks
  const httpServer = createHttpServer((req, res) => {
    // CORS headers for health checks
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        mode: 'observer',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }));
      return;
    }

    if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        observers: observers.size,
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

  // Set up Redis pub/sub for receiving pixel updates from API
  setupSubscriber(redis.subscriber, observers);

  // Handle new WebSocket connections
  wss.on('connection', (ws, req) => {
    handleConnection(ws, req, {
      redis: redis.client,
      publisher: redis.publisher,
      observers,
    });
  });

  // Start server
  httpServer.listen(config.port, () => {
    console.log(`WebSocket server listening on port ${config.port}`);
    console.log(`Health check: http://localhost:${config.port}/health`);
    console.log(`Metrics: http://localhost:${config.port}/metrics`);
    console.log('');
    console.log('Mode: OBSERVER ONLY');
    console.log('- Humans connect here to watch the canvas');
    console.log('- Agents use REST API to place pixels');
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');

    // Close all observer connections
    observers.forEach((ws) => {
      ws.close(1001, 'Server shutting down');
    });

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
