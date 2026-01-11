import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export function CompareTab() {
  const api = useApi();
  const [strategies, setStrategies] = useState([]);
  const [selected, setSelected] = useState([]);
  const [compareData, setCompareData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      const data = await api.fetchApi('/api/research/strategies');
      setStrategies(data.strategies || []);
    } catch (e) {
      console.error('Failed to load strategies:', e);
    }
  };

  const toggleStrategy = (name) => {
    if (selected.includes(name)) {
      setSelected(selected.filter(s => s !== name));
    } else if (selected.length < 5) {
      setSelected([...selected, name]);
    }
  };

  const runComparison = async () => {
    if (selected.length < 2) return;
    setLoading(true);
    try {
      const data = await api.fetchApi(`/api/research/compare?strategies=${selected.join(',')}`);
      setCompareData(data.results || []);
    } catch (e) {
      console.error('Failed to compare:', e);
    }
    setLoading(false);
  };

  // Group results by strategy
  const groupedByStrategy = compareData.reduce((acc, row) => {
    if (!acc[row.strategy_name]) {
      acc[row.strategy_name] = [];
    }
    acc[row.strategy_name].push(row);
    return acc;
  }, {});

  // Calculate aggregates per strategy
  const strategyAggregates = Object.entries(groupedByStrategy).map(([name, rows]) => ({
    strategy_name: name,
    symbols: rows.length,
    total_trades: rows.reduce((s, r) => s + (r.total_trades || 0), 0),
    avg_win_rate: rows.reduce((s, r) => s + (r.win_rate || 0), 0) / rows.length,
    total_pnl: rows.reduce((s, r) => s + (r.total_return || 0), 0),
    avg_sharpe: rows.reduce((s, r) => s + (r.sharpe_ratio || 0), 0) / rows.length,
  }));

  return (
    <div className="px-4">
      <h2 className="text-xl font-bold text-white mb-4">Compare Strategies</h2>

      {/* Strategy Selector */}
      <div className="bg-slate-800 rounded-lg p-4 mb-4">
        <div className="text-sm text-slate-400 mb-2">
          Select 2-5 strategies to compare ({selected.length}/5 selected)
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {strategies.map((s) => (
            <button
              key={s.strategy_name}
              onClick={() => toggleStrategy(s.strategy_name)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                selected.includes(s.strategy_name)
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {s.strategy_name} ({s.run_count})
            </button>
          ))}
        </div>
        <button
          onClick={runComparison}
          disabled={selected.length < 2 || loading}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded text-sm font-medium"
        >
          {loading ? 'Comparing...' : 'Compare Selected'}
        </button>
      </div>

      {/* Comparison Results */}
      {strategyAggregates.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-white mb-3">Aggregate Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {strategyAggregates.map((s) => (
              <div
                key={s.strategy_name}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700"
              >
                <div className="text-cyan-400 font-mono text-sm mb-3">{s.strategy_name}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-slate-500">Symbols</div>
                    <div className="text-white font-medium">{s.symbols}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Total Trades</div>
                    <div className="text-white font-medium">{s.total_trades}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Avg Win Rate</div>
                    <div className={s.avg_win_rate >= 60 ? 'text-green-400' : 'text-yellow-400'}>
                      {s.avg_win_rate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Total P&L</div>
                    <div className={s.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      ${s.total_pnl.toLocaleString()}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-slate-500">Avg Sharpe</div>
                    <div className={s.avg_sharpe >= 1 ? 'text-green-400' : 'text-slate-300'}>
                      {s.avg_sharpe.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Results Table */}
          <h3 className="text-lg font-semibold text-white mb-3">Detailed Results</h3>
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Strategy</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Symbol</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Trades</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Win Rate</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">P&L</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Sharpe</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {compareData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/50">
                      <td className="px-3 py-2 text-sm font-mono text-cyan-400">{row.strategy_name}</td>
                      <td className="px-3 py-2 text-sm font-bold text-white">{row.symbol}</td>
                      <td className="px-3 py-2 text-sm text-slate-300">{row.total_trades}</td>
                      <td className="px-3 py-2 text-sm">
                        <span className={row.win_rate >= 60 ? 'text-green-400' : 'text-yellow-400'}>
                          {row.win_rate?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span className={row.total_return >= 0 ? 'text-green-400' : 'text-red-400'}>
                          ${row.total_return?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-300">{row.sharpe_ratio?.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        {row.verdict === 'TRADE' && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">TRADE</span>
                        )}
                        {row.verdict === 'MARGINAL' && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">MARGINAL</span>
                        )}
                        {row.verdict === 'SKIP' && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">SKIP</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
