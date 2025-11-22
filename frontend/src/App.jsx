import React from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import StockCard from './components/StockCard';
import MetricsPanel from './components/MetricsPanel';
import './App.css';

function App() {
  const { stocks, metrics, connectionStatus, latency, error, reconnect } = useWebSocket();

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">
            <span className="pulse-icon">📈</span> StockPulse
          </h1>
          <p className="subtitle">Real-time Stock Market Data Stream</p>
        </header>

        <MetricsPanel
          metrics={metrics}
          latency={latency}
          connectionStatus={connectionStatus}
        />

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={reconnect} className="reconnect-btn">
              Reconnect
            </button>
          </div>
        )}

        {stocks.length === 0 && connectionStatus !== 'connected' && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Connecting to StockPulse...</p>
          </div>
        )}

        <div className="stocks-grid">
          {stocks.map((stock) => (
            <StockCard key={stock.symbol} stock={stock} />
          ))}
        </div>

        <footer className="footer">
          <p>🚀 Powered by Fastify + WebSocket + React + Vite</p>
          <p className="footer-note">
            Data updates every second • Simulated stock prices for demonstration
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
