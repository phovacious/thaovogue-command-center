import { useState } from 'react';
import { useApi } from '../hooks/useApi';

const EXAMPLE_JSON = `{
  "name": "MY_STRATEGY_V1",
  "entry": {
    "condition": "dip_pct >= 1.2 and rsi_5 < 25",
    "window_start": "10:00",
    "window_end": "11:00"
  },
  "exit": {
    "target_pct": 2.0,
    "stop_pct": null,
    "eod_exit": "15:55"
  },
  "gates": {
    "skip_days": ["Thursday", "Friday"],
    "skip_cpi": true
  },
  "capital": 50000,
  "symbols": ["TSLA", "NVDA", "AMD"]
}`;

export function ValidateTab() {
  const api = useApi();
  const [jsonInput, setJsonInput] = useState(EXAMPLE_JSON);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setJsonInput(event.target.result);
        setError(null);
      };
      reader.readAsText(file);
    }
  };

  const runValidation = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const config = JSON.parse(jsonInput);
      const response = await api.fetchApi('/api/research/validate', {
        method: 'POST',
        body: JSON.stringify(config),
      });

      if (response.status === 'ok') {
        setResults(response.results);
      } else {
        setError(response.message || 'Validation failed');
      }
    } catch (e) {
      if (e.message.includes('JSON')) {
        setError('Invalid JSON format. Please check your input.');
      } else {
        setError(e.message);
      }
    }
    setLoading(false);
  };

  const loadExample = () => {
    setJsonInput(EXAMPLE_JSON);
    setError(null);
    setResults(null);
  };

  return (
    <div className="px-4">
      <h2 className="text-xl font-bold text-white mb-4">Validate Strategy</h2>
      <p className="text-slate-400 mb-4">
        Paste a strategy config JSON to validate it against historical data.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">Strategy Config JSON</h3>
            <div className="flex gap-2">
              <button
                onClick={loadExample}
                className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded"
              >
                Load Example
              </button>
              <label className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 rounded cursor-pointer">
                Upload File
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-80 bg-slate-900 text-slate-200 font-mono text-sm p-3 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none resize-none"
            placeholder="Paste your strategy JSON here..."
            spellCheck={false}
          />

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={runValidation}
              disabled={loading || !jsonInput.trim()}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
            >
              {loading ? 'Running Backtest...' : 'Run Backtest'}
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Backtest Results</h3>

          {!results && !loading && (
            <div className="text-slate-500 text-center py-12">
              Run a backtest to see results here
            </div>
          )}

          {loading && (
            <div className="text-cyan-400 text-center py-12">
              <div className="animate-pulse">Running backtest...</div>
            </div>
          )}

          {results && results.results && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900 rounded p-3 text-center">
                  <div className="text-slate-500 text-xs">Symbols Tested</div>
                  <div className="text-xl font-bold text-white">{results.results.length}</div>
                </div>
                <div className="bg-slate-900 rounded p-3 text-center">
                  <div className="text-slate-500 text-xs">Total Trades</div>
                  <div className="text-xl font-bold text-white">
                    {results.results.reduce((s, r) => s + (r.total_trades || 0), 0)}
                  </div>
                </div>
                <div className="bg-slate-900 rounded p-3 text-center">
                  <div className="text-slate-500 text-xs">Total P&L</div>
                  <div className={`text-xl font-bold ${
                    results.results.reduce((s, r) => s + (r.total_pnl || 0), 0) >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    ${results.results.reduce((s, r) => s + (r.total_pnl || 0), 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Per-Symbol Results */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase">
                      <th className="text-left py-2">Symbol</th>
                      <th className="text-left py-2">Trades</th>
                      <th className="text-left py-2">Win Rate</th>
                      <th className="text-left py-2">P&L</th>
                      <th className="text-left py-2">Sharpe</th>
                      <th className="text-left py-2">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {results.results.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-700/50">
                        <td className="py-2 font-bold text-white">{r.symbol}</td>
                        <td className="py-2 text-slate-300">{r.total_trades}</td>
                        <td className="py-2">
                          <span className={r.win_rate >= 60 ? 'text-green-400' : r.win_rate >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                            {r.win_rate?.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2">
                          <span className={r.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                            ${r.total_pnl?.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-2 text-slate-300">{r.sharpe?.toFixed(2)}</td>
                        <td className="py-2">
                          {r.verdict === 'TRADE' && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">TRADE</span>
                          )}
                          {r.verdict === 'MARGINAL' && (
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">MARGINAL</span>
                          )}
                          {r.verdict === 'SKIP' && (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">SKIP</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reference */}
      <div className="mt-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Supported Conditions Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div>
            <div className="text-slate-300 font-medium mb-1">Entry Conditions</div>
            <ul className="space-y-0.5">
              <li><code className="text-cyan-400">dip_pct &gt;= X</code> - Dip from high</li>
              <li><code className="text-cyan-400">rsi_5 &lt; X</code> - RSI threshold</li>
              <li><code className="text-cyan-400">close &gt; sma_20</code> - Price vs SMA</li>
            </ul>
          </div>
          <div>
            <div className="text-slate-300 font-medium mb-1">Exit Options</div>
            <ul className="space-y-0.5">
              <li><code className="text-cyan-400">target_pct</code> - Profit target %</li>
              <li><code className="text-cyan-400">stop_pct</code> - Stop loss %</li>
              <li><code className="text-cyan-400">eod_exit</code> - Force close time</li>
            </ul>
          </div>
          <div>
            <div className="text-slate-300 font-medium mb-1">Gates (Filters)</div>
            <ul className="space-y-0.5">
              <li><code className="text-cyan-400">skip_days</code> - Days to skip</li>
              <li><code className="text-cyan-400">skip_cpi</code> - Skip CPI days</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
