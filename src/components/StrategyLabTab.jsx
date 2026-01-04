import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export function StrategyLabTab() {
  const api = useApi();
  const [pinnedStrategies, setPinnedStrategies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const data = await api.fetchApi('/api/lab/strategies');
        setPinnedStrategies(data.strategies || []);
      } catch (e) {
        console.error('Failed to fetch strategies:', e);
      }
      setLoading(false);
    };
    fetchStrategies();
  }, []);

  const handleUnpin = async (strategyId) => {
    try {
      await api.fetchApi(`/api/lab/unpin/${strategyId}`, { method: 'DELETE' });
      setPinnedStrategies(pinnedStrategies.filter(s => s.id !== strategyId));
    } catch (e) {
      console.error('Failed to unpin strategy:', e);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading strategies...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">📌 Strategy Lab</h2>
      </div>

      {pinnedStrategies.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">📌</div>
          <h3 className="text-lg font-medium text-white mb-2">No Pinned Strategies</h3>
          <p className="text-slate-400 mb-4">
            Pin strategies from the Trades or Backtest tabs to track them here.
          </p>
          <div className="text-sm text-slate-500">
            <p>How to use Strategy Lab:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-left max-w-md mx-auto">
              <li>Run a backtest with promising results</li>
              <li>Click "📌 Pin to Lab" to save the strategy</li>
              <li>Track live performance vs backtest</li>
              <li>Get alerts on divergence</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {pinnedStrategies.map((strategy) => (
            <div key={strategy.id} className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-white">{strategy.name}</h3>
                  <div className="text-sm text-slate-500">{strategy.symbol}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">
                    Pinned {new Date(strategy.pinned_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleUnpin(strategy.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                    title="Unpin strategy"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-slate-400">Backtest WR</div>
                  <div className="text-white font-mono">{strategy.backtest_win_rate?.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-slate-400">Backtest P&L</div>
                  <div className={`font-mono ${strategy.backtest_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {strategy.backtest_pnl >= 0 ? '+' : ''}${strategy.backtest_pnl?.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Trades</div>
                  <div className="text-white font-mono">{strategy.backtest_trades}</div>
                </div>
                <div>
                  <div className="text-slate-400">Live WR</div>
                  <div className="text-white font-mono">
                    {strategy.live_trades > 0 ? `${strategy.live_win_rate?.toFixed(1)}%` : '--'}
                  </div>
                </div>
              </div>
              {strategy.live_trades > 0 && strategy.divergence > 10 && (
                <div className="mt-3 p-2 bg-red-500/20 rounded text-red-400 text-sm">
                  ⚠️ Divergence alert: {strategy.divergence?.toFixed(1)}% difference from backtest
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
