import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import OpenAI from 'openai';
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

// Initialize AI client (supports Groq, xAI Grok, or OpenAI)
// Priority: GROQ_API_KEY > XAI_API_KEY > OPENAI_API_KEY
const aiApiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY || process.env.OPENAI_API_KEY;
let baseURL = 'https://api.openai.com/v1';
if (process.env.GROQ_API_KEY) {
  baseURL = 'https://api.groq.com/openai/v1';
} else if (process.env.XAI_API_KEY) {
  baseURL = 'https://api.x.ai/v1';
}

const openai = aiApiKey ? new OpenAI({
  apiKey: aiApiKey,
  baseURL: baseURL
}) : null;

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

// Stock Analysis API endpoint
fastify.post('/api/analyze-stocks', async (request, reply) => {
  if (!openai) {
    return reply.code(503).send({
      error: 'AI analysis service not configured. Please set GROQ_API_KEY, XAI_API_KEY, or OPENAI_API_KEY environment variable.'
    });
  }

  const { companies } = request.body;

  if (!companies || !Array.isArray(companies) || companies.length === 0) {
    return reply.code(400).send({
      error: 'Please provide an array of company names'
    });
  }

  try {
    const prompt = `You are a knowledgeable stock market analyst. A user is interested in investing and wants to compare these companies: ${companies.join(', ')}.

Please provide a comprehensive analysis in JSON format with the following structure:
{
  "companies": [
    {
      "name": "Company Name",
      "overview": "Brief overview of the company and its business",
      "strengths": ["3-4 key strengths"],
      "risks": ["3-4 key risks or concerns"]
    }
  ],
  "comparison": "A paragraph comparing these companies and their relative positions in the market",
  "recommendations": [
    "Step 1: Specific action item",
    "Step 2: Specific action item",
    "Step 3: Specific action item",
    "Step 4: Specific action item"
  ],
  "disclaimer": "Standard investment disclaimer"
}

Provide practical, actionable recommendations. Be honest about risks. Focus on helping a retail investor make informed decisions.`;

    // Select model based on which API key is being used
    let model = "gpt-4o-mini"; // OpenAI default
    if (process.env.GROQ_API_KEY) {
      model = "llama-3.3-70b-versatile"; // Groq's latest free model
    } else if (process.env.XAI_API_KEY) {
      model = "grok-beta"; // xAI Grok
    }
    
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a helpful stock market analyst who provides clear, honest, and actionable investment guidance. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    return analysis;

  } catch (error) {
    fastify.log.error('Error analyzing stocks:', error);
    console.error('Full error details:', error);
    return reply.code(500).send({
      error: 'Failed to analyze stocks',
      message: error.message,
      details: error.stack
    });
  }
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
