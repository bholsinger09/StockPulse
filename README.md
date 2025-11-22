# 📈 StockPulse

Real-time stock price streaming application with WebSocket support, built with React + Vite frontend and Fastify backend.

## 🚀 Features

- **Real-time Stock Updates**: Simulated stock prices updated every second
- **WebSocket API**: Efficient bi-directional communication
- **Performance Metrics**: Live monitoring of latency, throughput, and connection stats
- **Load Testing**: Built-in tools to test WebSocket performance
- **Modern Stack**: React + Vite for frontend, Fastify for backend
- **Responsive UI**: Beautiful, mobile-friendly interface

## 📋 Architecture

```
StockPulse/
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks (WebSocket)
│   │   ├── App.jsx        # Main application
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── backend/               # Node.js + Fastify server
│   ├── src/
│   │   ├── server.js          # Main server with WebSocket
│   │   ├── stock-simulator.js # Stock price generator
│   │   └── metrics-tracker.js # Performance monitoring
│   ├── tests/
│   │   └── load-test.js       # Load testing script
│   └── package.json
│
└── package.json           # Root package with workspace scripts
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **WebSocket API** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Fastify** - Fast web framework
- **@fastify/websocket** - WebSocket support
- **@fastify/cors** - CORS handling

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/bholsinger09/StockPulse.git
cd StockPulse
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

3. **Start the backend server**
```bash
npm run dev:backend
```

The backend will start on `http://localhost:3001`

4. **Start the frontend (in a new terminal)**
```bash
npm run dev:frontend
```

The frontend will start on `http://localhost:5173`

5. **Open your browser**
Navigate to `http://localhost:5173` to see StockPulse in action!

## 🎮 Usage

### Development Mode

Run both frontend and backend concurrently:
```bash
npm run dev
```

### Individual Components

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

### Load Testing

Test the WebSocket performance with multiple concurrent connections:

```bash
# Default: 10 clients for 30 seconds
npm run test:load

# Custom test: 50 clients for 60 seconds
cd backend
node tests/load-test.js --clients 50 --duration 60

# With verbose logging
node tests/load-test.js -c 100 -d 120 -v
```

**Load Test Options:**
- `-c, --clients <n>`: Number of concurrent clients (default: 10)
- `-d, --duration <s>`: Test duration in seconds (default: 30)
- `-v, --verbose`: Enable verbose logging
- `-h, --help`: Show help message

## 📊 API Endpoints

### HTTP Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /metrics` - Performance metrics
- `GET /stocks` - Current stock prices

### WebSocket Endpoint

- `WS /ws` - Real-time stock updates

**Message Types:**

**From Server:**
- `initial` - Initial stock prices on connection
- `update` - Stock price updates (every 1 second)
- `pong` - Response to ping (for latency measurement)

**From Client:**
- `ping` - Request latency measurement

## 🎯 Key Features Explained

### Stock Simulation
The backend generates realistic stock price movements with configurable volatility for 8 major stocks (AAPL, GOOGL, MSFT, AMZN, TSLA, META, NVDA, NFLX).

### Performance Monitoring
Real-time tracking of:
- Active WebSocket connections
- Messages per second
- Total messages sent
- Average latency (round-trip time)
- Server uptime

### Auto-Reconnection
The frontend automatically attempts to reconnect if the WebSocket connection is lost.

## 🔧 Configuration

### Backend Configuration

Edit `backend/src/server.js`:

```javascript
const UPDATE_INTERVAL = 1000; // Update frequency in ms
const port = process.env.PORT || 3001;
```

### Frontend Configuration

Edit `frontend/src/hooks/useWebSocket.js`:

```javascript
const WS_URL = 'ws://localhost:3001/ws';
const PING_INTERVAL = 5000; // Ping frequency in ms
```

## 📈 Performance

Expected performance metrics:
- **Latency**: < 50ms on local network
- **Throughput**: 1000+ messages/second with 100+ concurrent clients
- **Updates**: 1 update per second per stock (8 stocks total)

## 🐛 Troubleshooting

### Backend won't start
- Ensure port 3001 is not in use
- Check Node.js version (18+ required)
- Run `npm install` in the backend directory

### Frontend can't connect
- Verify backend is running on port 3001
- Check browser console for errors
- Ensure WebSocket URL is correct in `useWebSocket.js`

### Load test fails
- Make sure backend is running
- Check that port 3001 is accessible
- Verify no firewall blocking WebSocket connections

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning and development.

## 👨‍💻 Author

Ben Holsinger - [GitHub](https://github.com/bholsinger09)

## 🙏 Acknowledgments

- Built with Fastify for high-performance WebSocket handling
- React + Vite for modern frontend development
- Inspired by real-time stock trading platforms

---

**Happy Coding! 🚀**
