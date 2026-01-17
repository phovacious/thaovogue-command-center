import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export function EquityTab() {
  const api = useApi();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.fetchApi('/api/equity/status');
        setStatus(data);
      } catch (e) {
        console.error('Failed to fetch equity status:', e);
      }
      setLoading(false);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-slate-400">Loading equity swarm...</p>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>📈</span> Equity Swarm
        </h1>
        <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium">
          Coming Soon
        </span>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-xl font-bold text-white mb-2">Equity Swarm Under Development</h2>
        <p className="text-slate-400 max-w-lg mx-auto">
          The equity swarm will mirror the crypto swarm architecture with momentum traders,
          dip buyers, and coordinated risk management for stock trading.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm font-medium text-white">Momentum Trader</div>
            <div className="text-xs text-slate-400">Catch breakouts</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-2xl mb-2">📉</div>
            <div className="text-sm font-medium text-white">Dip Buyer</div>
            <div className="text-xs text-slate-400">Buy oversold</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-2xl mb-2">🛡️</div>
            <div className="text-sm font-medium text-white">Risk Manager</div>
            <div className="text-xs text-slate-400">Position sizing</div>
          </div>
        </div>
      </div>

      {/* SPX Fleet Status (if available) */}
      {status?.spx_fleet && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="font-bold text-white mb-3">SPX Fleet (Paper Trading)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-slate-400 text-xs">Status</span>
              <div className={`font-mono ${status.spx_fleet.running ? 'text-green-400' : 'text-red-400'}`}>
                {status.spx_fleet.running ? 'Running' : 'Stopped'}
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-xs">Today P&L</span>
              <div className={`font-mono ${status.spx_fleet.daily_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${status.spx_fleet.daily_pnl?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-xs">Trades Today</span>
              <div className="font-mono text-white">{status.spx_fleet.trades_today || 0}</div>
            </div>
            <div>
              <span className="text-slate-400 text-xs">Win Rate</span>
              <div className="font-mono text-cyan-400">{status.spx_fleet.win_rate || 0}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
