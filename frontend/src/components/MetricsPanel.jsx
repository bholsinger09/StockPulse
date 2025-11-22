import React from 'react';
import './MetricsPanel.css';

const MetricsPanel = ({ metrics, latency, connectionStatus }) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#22c55e';
      case 'connecting':
        return '#eab308';
      case 'disconnected':
      case 'error':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  const getStatusText = () => {
    return connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1);
  };

  return (
    <div className="metrics-panel">
      <h3 className="metrics-title">📊 Performance Metrics</h3>

      <div className="metrics-grid">
        <div className="metric-item">
          <span className="metric-label">Status</span>
          <span
            className="metric-value status-value"
            style={{ color: getStatusColor() }}
          >
            {getStatusText()}
          </span>
        </div>

        <div className="metric-item">
          <span className="metric-label">Latency</span>
          <span className="metric-value">
            {latency > 0 ? `${latency}ms` : '-'}
          </span>
        </div>

        {metrics && (
          <>
            <div className="metric-item">
              <span className="metric-label">Active Connections</span>
              <span className="metric-value">{metrics.connections}</span>
            </div>

            <div className="metric-item">
              <span className="metric-label">Messages/sec</span>
              <span className="metric-value">{metrics.messagesPerSecond}</span>
            </div>

            <div className="metric-item">
              <span className="metric-label">Total Messages</span>
              <span className="metric-value">{metrics.totalMessagesSent.toLocaleString()}</span>
            </div>

            <div className="metric-item">
              <span className="metric-label">Uptime</span>
              <span className="metric-value">{metrics.uptime}s</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MetricsPanel;
