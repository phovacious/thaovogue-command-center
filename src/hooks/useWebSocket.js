import { useState, useEffect, useRef, useCallback } from 'react';
import { useAfterFirstPaint } from './useAfterFirstPaint';
import { getCache, setCache } from '../utils/cache';

// Use secure WebSocket connection via nginx + SSL
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://159-65-250-246.sslip.io/ws';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  // Load cached desk data for instant UI
  const [deskData, setDeskData] = useState(() => {
    const cached = getCache('/ws/desk');
    return cached?.value || null;
  });
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const ready = useAfterFirstPaint(); // Defer connection until after first paint

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
        // Request initial snapshot
        wsRef.current.send(JSON.stringify({ type: 'get_snapshot' }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);

          if (message.type === 'snapshot' || message.type === 'desk_update') {
            setDeskData(message.data);
            // Cache for instant startup next time
            setCache('/ws/desk', message.data);
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected, reconnecting in 3s...');
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Defer WebSocket connection until after first paint for faster startup
  useEffect(() => {
    if (!ready) return; // Wait for first paint

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, ready]);

  return { isConnected, lastMessage, deskData, sendMessage };
}
