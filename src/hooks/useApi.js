import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://159-65-250-246.sslip.io';
const isDev = import.meta.env.DEV;

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApi = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    const { timeoutMs = 8000, ...fetchOptions } = options;
    const controller = fetchOptions.signal ? null : new AbortController();
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;

    const startTime = isDev ? performance.now() : 0;

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        signal: fetchOptions.signal || controller?.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (isDev) {
        const duration = (performance.now() - startTime).toFixed(0);
        console.log(`[api] ${endpoint} (${duration}ms)`);
      }

      setLoading(false);
      return data;
    } catch (err) {
      if (isDev) {
        const duration = (performance.now() - startTime).toFixed(0);
        console.log(`[api] ${endpoint} FAILED (${duration}ms):`, err.message);
      }
      if (err.name === 'AbortError') {
        setError(`Timeout after ${timeoutMs}ms`);
        setLoading(false);
        throw new Error(`Timeout after ${timeoutMs}ms`);
      }
      setError(err.message);
      setLoading(false);
      throw err;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
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

  // Signal Hunting v7.1
  const getValuesTab = () => fetchApi('/api/values-tab');

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
    getValuesTab,
  };
}
