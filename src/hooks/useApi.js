import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://ericsson-modems-cricket-civilization.trycloudflare.com';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApi = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  // Convenience methods
  const getSnapshot = () => fetchApi('/api/desk/snapshot');
  const getPositions = () => fetchApi('/api/desk/positions');
  const getBots = () => fetchApi('/api/desk/bots');
  const getEvents = (limit = 50) => fetchApi(`/api/desk/events?limit=${limit}`);
  const getDailyPnl = () => fetchApi('/api/desk/pnl');
  const getAlerts = () => fetchApi('/api/alerts');

  // Copy endpoints
  const getCopySnapshot = (compact = false) =>
    fetchApi(`/api/copy/snapshot?compact=${compact}`);
  const getCopyClaudeContext = () => fetchApi('/api/copy/claude-context');
  const getCopyPositions = () => fetchApi('/api/copy/positions');

  // Backtest
  const runBacktest = (request) =>
    fetchApi('/api/backtest/run', {
      method: 'POST',
      body: JSON.stringify(request),
    });

  return {
    loading,
    error,
    fetchApi,
    getSnapshot,
    getPositions,
    getBots,
    getEvents,
    getDailyPnl,
    getAlerts,
    getCopySnapshot,
    getCopyClaudeContext,
    getCopyPositions,
    runBacktest,
  };
}
