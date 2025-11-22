// WebSocket hook for managing connection and data
import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:3001/ws';
const PING_INTERVAL = 5000; // Send ping every 5 seconds

export const useWebSocket = () => {
  const [stocks, setStocks] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [latency, setLatency] = useState(0);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingTimestampRef = useRef(0);

  const connect = useCallback(() => {
    try {
      setConnectionStatus('connecting');
      setError(null);

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');

        // Start sending pings
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            pingTimestampRef.current = Date.now();
            ws.send(JSON.stringify({
              type: 'ping',
              clientTime: pingTimestampRef.current
            }));
          }
        }, PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'initial':
              setStocks(data.stocks);
              break;

            case 'update':
              setStocks(data.stocks);
              if (data.metrics) {
                setMetrics(data.metrics);
              }
              break;

            case 'pong':
              // Calculate round-trip latency
              const now = Date.now();
              const rtt = now - pingTimestampRef.current;
              setLatency(rtt);
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error occurred');
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };

    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create connection');
      setConnectionStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    stocks,
    metrics,
    connectionStatus,
    latency,
    error,
    reconnect: connect
  };
};
