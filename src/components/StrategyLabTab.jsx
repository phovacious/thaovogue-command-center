import { useState } from 'react';

export function StrategyLabTab() {
  const [pinnedStrategies] = useState([]);

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
          {pinnedStrategies.map((strategy, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">{strategy.name}</h3>
                <span className="text-sm text-slate-500">Pinned {strategy.pinnedAt}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-slate-400">Backtest</div>
                  <div className="text-white font-mono">{strategy.backtestWinRate}% WR</div>
                </div>
                <div>
                  <div className="text-slate-400">Live</div>
                  <div className="text-white font-mono">{strategy.liveWinRate}% WR</div>
                </div>
                <div>
                  <div className="text-slate-400">Divergence</div>
                  <div className={strategy.divergence > 10 ? 'text-red-400' : 'text-green-400'}>
                    {strategy.divergence}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
