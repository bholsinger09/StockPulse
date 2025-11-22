import React, { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import StockCard from './components/StockCard';
import MetricsPanel from './components/MetricsPanel';
import StockAssistant from './components/StockAssistant';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('tracker');
  const { stocks, metrics, connectionStatus, latency, error, reconnect } = useWebSocket();

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">
            <span className="pulse-icon">📈</span> StockPulse
          </h1>
          <p className="subtitle">Real-time Stock Market Data Stream</p>
          
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'tracker' ? 'active' : ''}`}
              onClick={() => setActiveTab('tracker')}
            >
              📊 Live Tracker
            </button>
            <button 
              className={`tab ${activeTab === 'assistant' ? 'active' : ''}`}
              onClick={() => setActiveTab('assistant')}
            >
              🛒 Stock Shopping Assistant
            </button>
          </div>
        </header>

        {activeTab === 'tracker' ? (
          <>
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
          </>
        ) : (
          <StockAssistant />
        )}

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
