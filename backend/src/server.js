import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import StockSimulator from './stock-simulator.js';
import MetricsTracker from './metrics-tracker.js';

const fastify = Fastify({
  logger: true
});

// Register plugins
await fastify.register(cors, {
  origin: '*'
});

await fastify.register(websocket, {
  options: {
    maxPayload: 1048576, // 1MB
    clientTracking: true
  }
});

// Initialize simulator and metrics
const simulator = new StockSimulator();
const metrics = new MetricsTracker();

// Store connected clients
const clients = new Set();

// Update interval (milliseconds)
const UPDATE_INTERVAL = 1000; // 1 second updates

// Root route
fastify.get('/', async (request, reply) => {
  return {
    name: 'StockPulse API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      websocket: '/ws',
      health: '/health',
      metrics: '/metrics',
      stocks: '/stocks'
    }
  };
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime()
  };
});

// Get current metrics
fastify.get('/metrics', async (request, reply) => {
  return metrics.getMetrics();
});

// Get current stock prices
fastify.get('/stocks', async (request, reply) => {
  return {
    stocks: simulator.getCurrentPrices(),
    timestamp: Date.now()
  };
});

// WebSocket endpoint
fastify.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, (socket, request) => {
    const clientId = Math.random().toString(36).substring(7);

    fastify.log.info(`Client ${clientId} connected`);
    clients.add(socket);
    metrics.addConnection();

    // Send initial stock prices
    const initialData = {
      type: 'initial',
      stocks: simulator.getCurrentPrices(),
      clientId,
      serverTime: Date.now()
    };
    socket.send(JSON.stringify(initialData));

    // Handle messages from client
    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'ping') {
          // Respond to ping with pong for latency measurement
          socket.send(JSON.stringify({
            type: 'pong',
            clientTime: data.clientTime,
            serverTime: Date.now()
          }));
        }
      } catch (error) {
        fastify.log.error(`Error parsing message: ${error.message}`);
      }
    });

    // Handle disconnection
    socket.on('close', () => {
      fastify.log.info(`Client ${clientId} disconnected`);
      clients.delete(socket);
      metrics.removeConnection();
    });

    // Handle errors
    socket.on('error', (error) => {
      fastify.log.error(`WebSocket error for client ${clientId}: ${error.message}`);
      clients.delete(socket);
      metrics.removeConnection();
    });
  });
});

// Broadcast stock updates to all connected clients
function broadcastStockUpdates() {
  if (clients.size === 0) return;

  const updatedStocks = simulator.updatePrices();
  const currentMetrics = metrics.getMetrics();

  const message = JSON.stringify({
    type: 'update',
    stocks: updatedStocks,
    metrics: currentMetrics,
    serverTime: Date.now()
  });

  let successCount = 0;
  clients.forEach((socket) => {
    try {
      if (socket.readyState === 1) { // 1 = OPEN
        socket.send(message);
        metrics.recordMessage();
        successCount++;
      }
    } catch (error) {
      fastify.log.error(`Error sending to client: ${error.message}`);
      clients.delete(socket);
      metrics.removeConnection();
    }
  });

  if (successCount > 0) {
    fastify.log.debug(`Broadcast to ${successCount} clients`);
  }
}

// Start broadcasting updates
const broadcastInterval = setInterval(broadcastStockUpdates, UPDATE_INTERVAL);

// Graceful shutdown
const closeGracefully = async (signal) => {
  fastify.log.info(`Received ${signal}, closing gracefully`);
  clearInterval(broadcastInterval);

  // Close all WebSocket connections
  clients.forEach((socket) => {
    try {
      socket.close();
    } catch (error) {
      fastify.log.error(`Error closing socket: ${error.message}`);
    }
  });

  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    console.log('\n🚀 StockPulse Server Started');
    console.log(`📡 WebSocket: ws://localhost:${port}/ws`);
    console.log(`🌐 HTTP API: http://localhost:${port}`);
    console.log(`📊 Metrics: http://localhost:${port}/metrics`);
    console.log(`❤️  Health: http://localhost:${port}/health\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
