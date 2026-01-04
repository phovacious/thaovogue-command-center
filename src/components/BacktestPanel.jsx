import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { CopyButton } from './CopyButton';

// Available symbols for backtesting
const AVAILABLE_SYMBOLS = [
  { group: 'Equity Bots', symbols: ['NVDA', 'TSLA', 'AMD', 'PLTR', 'META', 'GOOG', 'AAPL', 'SMCI', 'COIN'] },
  { group: 'SPX Options', symbols: ['SPX', 'SPY'] },
  { group: 'Crypto', symbols: ['BTC', 'ETH'] },
];

// Get last 30 days as default date range
const getDefaultDates = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

export function BacktestPanel() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const defaultDates = getDefaultDates();

  const [form, setForm] = useState({
    symbols: 'NVDA',
    dateStart: defaultDates.start,
    dateEnd: defaultDates.end,
    entryTimeStart: '09:35',
    entryTimeEnd: '11:00',
    stopLossPct: 1.0,
    takeProfitPct: 2.0,
    side: 'LONG',
    capital: 25000,
    riskPercent: 2,
    positionSizing: 'risk-based',
  });
  const [pinning, setPinning] = useState(false);

  // Calculate position size preview
  const positionSizePreview = (() => {
    if (form.positionSizing === 'fixed') return 1000;
    if (form.positionSizing === 'percent') return form.capital * (form.riskPercent / 100);
    // Risk-based: capital * risk%
    return form.capital * (form.riskPercent / 100);
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const request = {
        symbols: form.symbols.split(',').map(s => s.trim().toUpperCase()),
        date_start: form.dateStart,
        date_end: form.dateEnd,
        entry_time_start: form.entryTimeStart,
        entry_time_end: form.entryTimeEnd,
        stop_loss_pct: parseFloat(form.stopLossPct),
        take_profit_pct: parseFloat(form.takeProfitPct),
        side: form.side,
        position_size: 100,
      };

      const data = await api.runBacktest(request);
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-slate-800/70 rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Run Backtest</h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Symbol</label>
            <select
              value={form.symbols}
              onChange={(e) => setForm({ ...form, symbols: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              {AVAILABLE_SYMBOLS.map(group => (
                <optgroup key={group.group} label={group.group}>
                  {group.symbols.map(sym => (
                    <option key={sym} value={sym}>{sym}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={form.dateStart}
              onChange={(e) => setForm({ ...form, dateStart: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={form.dateEnd}
              onChange={(e) => setForm({ ...form, dateEnd: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Entry Window Start</label>
            <input
              type="time"
              value={form.entryTimeStart}
              onChange={(e) => setForm({ ...form, entryTimeStart: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Entry Window End</label>
            <input
              type="time"
              value={form.entryTimeEnd}
              onChange={(e) => setForm({ ...form, entryTimeEnd: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Side</label>
            <select
              value={form.side}
              onChange={(e) => setForm({ ...form, side: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="LONG">Long</option>
              <option value="SHORT">Short</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Stop Loss %</label>
            <input
              type="number"
              step="0.1"
              value={form.stopLossPct}
              onChange={(e) => setForm({ ...form, stopLossPct: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Take Profit %</label>
            <input
              type="number"
              step="0.1"
              value={form.takeProfitPct}
              onChange={(e) => setForm({ ...form, takeProfitPct: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* Position Sizing Section */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h4 className="text-sm font-medium text-slate-400 mb-3">Position Sizing</h4>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Capital ($)</label>
              <input
                type="number"
                value={form.capital}
                onChange={(e) => setForm({ ...form, capital: Number(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono"
                min="1000"
                step="1000"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Risk per Trade (%)</label>
              <input
                type="number"
                value={form.riskPercent}
                onChange={(e) => setForm({ ...form, riskPercent: Number(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono"
                min="0.5"
                max="10"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Sizing Method</label>
              <select
                value={form.positionSizing}
                onChange={(e) => setForm({ ...form, positionSizing: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="risk-based">Risk-Based (ATR Stop)</option>
                <option value="percent">% of Capital</option>
                <option value="fixed">Fixed Dollar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Position Size</label>
              <div className="bg-slate-600 rounded-lg px-3 py-2 font-mono text-green-400">
                ${positionSizePreview.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Run Backtest'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
      </form>

      {/* Results */}
      {result && (
        <div className="bg-slate-800/70 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Results</h3>
            <CopyButton
              label="Copy Results"
              getText={async () => {
                const data = await api.fetchApi('/api/copy/backtest', {
                  method: 'POST',
                  body: JSON.stringify({
                    strategy_name: `${form.symbols} Backtest`,
                    symbol: form.symbols,
                    start_date: form.dateStart,
                    end_date: form.dateEnd,
                    ...result,
                  }),
                });
                return data.text;
              }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-sm text-slate-400">Trades</div>
              <div className="text-xl font-mono font-bold text-white">{result.trades_taken}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-sm text-slate-400">Win Rate</div>
              <div className="text-xl font-mono font-bold text-white">{result.win_rate?.toFixed(1)}%</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-sm text-slate-400">Profit Factor</div>
              <div className="text-xl font-mono font-bold text-white">{result.profit_factor?.toFixed(2)}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-sm text-slate-400">Total P&L</div>
              <div className={`text-xl font-mono font-bold ${result.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {result.total_pnl >= 0 ? '+' : ''}${result.total_pnl?.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-700/50">
              <span className="text-slate-400">Wins:</span>
              <span className="text-green-400 font-mono">{result.win_count}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/50">
              <span className="text-slate-400">Losses:</span>
              <span className="text-red-400 font-mono">{result.loss_count}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/50">
              <span className="text-slate-400">Avg Win:</span>
              <span className="text-green-400 font-mono">+${result.avg_win?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/50">
              <span className="text-slate-400">Avg Loss:</span>
              <span className="text-red-400 font-mono">${result.avg_loss?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/50">
              <span className="text-slate-400">Largest Win:</span>
              <span className="text-green-400 font-mono">+${result.largest_win?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-700/50">
              <span className="text-slate-400">Largest Loss:</span>
              <span className="text-red-400 font-mono">${result.largest_loss?.toFixed(2)}</span>
            </div>
          </div>

          {/* Pin to Strategy Lab Button */}
          <div className="flex justify-end mt-6 pt-4 border-t border-slate-700">
            <button
              onClick={async () => {
                setPinning(true);
                try {
                  const params = new URLSearchParams({
                    name: `${form.symbols} ${form.side} ${form.stopLossPct}%SL/${form.takeProfitPct}%TP`,
                    symbol: form.symbols,
                    backtest_win_rate: result.win_rate || 0,
                    backtest_pnl: result.total_pnl || 0,
                    backtest_trades: result.trades_taken || 0,
                  });
                  await api.fetchApi(`/api/lab/pin?${params.toString()}`, { method: 'POST' });
                  alert('Strategy pinned to Strategy Lab!');
                } catch (e) {
                  console.error('Failed to pin strategy:', e);
                  alert('Failed to pin strategy');
                }
                setPinning(false);
              }}
              disabled={pinning}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {pinning ? 'Pinning...' : '📌 Pin to Strategy Lab'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
