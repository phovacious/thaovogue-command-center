import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { CopyButton } from './CopyButton';

// Available symbols for backtesting
const AVAILABLE_SYMBOLS = [
  { group: 'Equity Bots', symbols: ['NVDA', 'TSLA', 'AMD', 'PLTR', 'META', 'GOOG', 'AAPL', 'SMCI', 'COIN'] },
  { group: 'SPX Options', symbols: ['SPX', 'SPY'] },
  { group: 'ETFs', symbols: ['QQQ', 'IWM'] },
];

// Available strategies
const STRATEGIES = [
  { value: 'sma_crossover', label: 'SMA Crossover (10/20)' },
  { value: 'rsi', label: 'RSI Mean Reversion (30/70)' },
  { value: 'macd', label: 'MACD Crossover' },
  { value: 'bollinger', label: 'Bollinger Bands' },
  { value: 'momentum', label: 'Momentum (10-day)' },
  { value: 'mean_reversion', label: 'Mean Reversion (Z-Score)' },
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

// Format number with sign
const formatPnl = (value, decimals = 2) => {
  if (value === undefined || value === null) return '$0.00';
  const formatted = Math.abs(value).toFixed(decimals);
  return value >= 0 ? `+$${formatted}` : `-$${formatted}`;
};

// Equity Chart Component (simple SVG)
function EquityChart({ data }) {
  if (!data || data.length < 2) return null;

  const width = 600;
  const height = 200;
  const padding = 40;

  const equities = data.map(d => d.equity);
  const drawdowns = data.map(d => d.drawdown_pct || 0);
  const minEq = Math.min(...equities);
  const maxEq = Math.max(...equities);
  const maxDD = Math.max(...drawdowns);

  const scaleX = (i) => padding + (i / (data.length - 1)) * (width - 2 * padding);
  const scaleY = (val) => height - padding - ((val - minEq) / (maxEq - minEq || 1)) * (height - 2 * padding);
  const scaleDDY = (val) => padding + (val / (maxDD || 1)) * (height - 2 * padding) * 0.3;

  // Build equity path
  const eqPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.equity)}`).join(' ');

  // Build drawdown area
  const ddPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleDDY(d.drawdown_pct || 0)}`).join(' ');
  const ddArea = `${ddPath} L ${scaleX(data.length - 1)} ${scaleDDY(0)} L ${scaleX(0)} ${scaleDDY(0)} Z`;

  return (
    <div className="bg-slate-700/30 rounded-lg p-4">
      <div className="text-sm text-slate-400 mb-2">Equity Curve with Drawdown</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <line
            key={pct}
            x1={padding}
            y1={padding + pct * (height - 2 * padding)}
            x2={width - padding}
            y2={padding + pct * (height - 2 * padding)}
            stroke="#374151"
            strokeWidth="1"
          />
        ))}

        {/* Drawdown area (red) */}
        <path d={ddArea} fill="rgba(239, 68, 68, 0.2)" />

        {/* Equity line */}
        <path d={eqPath} fill="none" stroke="#22c55e" strokeWidth="2" />

        {/* Start/End labels */}
        <text x={padding} y={height - 10} fill="#94a3b8" fontSize="10">
          ${equities[0]?.toLocaleString()}
        </text>
        <text x={width - padding} y={height - 10} fill="#94a3b8" fontSize="10" textAnchor="end">
          ${equities[equities.length - 1]?.toLocaleString()}
        </text>

        {/* Max DD label */}
        {maxDD > 0 && (
          <text x={width - padding} y={20} fill="#ef4444" fontSize="10" textAnchor="end">
            Max DD: {maxDD.toFixed(1)}%
          </text>
        )}
      </svg>
    </div>
  );
}

// Risk Metrics Card
function RiskMetricsCard({ metrics }) {
  if (!metrics) return null;

  const items = [
    { label: 'Sharpe Ratio', value: metrics.sharpe_ratio?.toFixed(2) || '0.00', good: metrics.sharpe_ratio > 1 },
    { label: 'Sortino Ratio', value: metrics.sortino_ratio?.toFixed(2) || '0.00', good: metrics.sortino_ratio > 1.5 },
    { label: 'Max Drawdown', value: `${metrics.max_drawdown_pct?.toFixed(1)}%` || '0%', good: metrics.max_drawdown_pct < 10 },
    { label: 'Calmar Ratio', value: metrics.calmar_ratio?.toFixed(2) || '0.00', good: metrics.calmar_ratio > 1 },
  ];

  return (
    <div className="bg-slate-700/30 rounded-lg p-4">
      <div className="text-sm text-slate-400 mb-3">Risk Metrics</div>
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item.label} className="flex justify-between items-center py-1">
            <span className="text-slate-400 text-sm">{item.label}</span>
            <span className={`font-mono font-medium ${item.good ? 'text-green-400' : 'text-yellow-400'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Trade Statistics Card
function TradeStatsCard({ stats }) {
  if (!stats) return null;

  return (
    <div className="bg-slate-700/30 rounded-lg p-4">
      <div className="text-sm text-slate-400 mb-3">Trade Statistics</div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Win Rate</span>
          <span className={`font-mono font-medium ${stats.win_rate > 50 ? 'text-green-400' : 'text-yellow-400'}`}>
            {stats.win_rate?.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Profit Factor</span>
          <span className={`font-mono font-medium ${stats.profit_factor > 1.5 ? 'text-green-400' : 'text-yellow-400'}`}>
            {stats.profit_factor?.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Expectancy</span>
          <span className={`font-mono font-medium ${stats.expectancy > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPnl(stats.expectancy)}/trade
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Avg Win/Loss</span>
          <span className="font-mono font-medium text-white">
            {stats.avg_win_loss_ratio?.toFixed(2)}
          </span>
        </div>
        <div className="border-t border-slate-600 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Win Streak</span>
            <span className="font-mono text-green-400">{stats.win_streak}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Loss Streak</span>
            <span className="font-mono text-red-400">{stats.loss_streak}</span>
          </div>
        </div>
        <div className="border-t border-slate-600 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Largest Win</span>
            <span className="font-mono text-green-400">{formatPnl(stats.largest_win)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Largest Loss</span>
            <span className="font-mono text-red-400">{formatPnl(stats.largest_loss)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BacktestPanel() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const defaultDates = getDefaultDates();

  const [form, setForm] = useState({
    symbol: 'NVDA',
    strategy: 'sma_crossover',
    dateStart: defaultDates.start,
    dateEnd: defaultDates.end,
    capital: 100000,
    riskPercent: 1,
    slippagePct: 0.01,
    commissionPerShare: 0.005,
  });
  const [pinning, setPinning] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        symbol: form.symbol,
        strategy: form.strategy,
        start_date: form.dateStart,
        end_date: form.dateEnd,
        capital: form.capital,
        risk_pct: form.riskPercent,
        slippage_pct: form.slippagePct,
        commission_per_share: form.commissionPerShare,
      });

      const data = await api.fetchApi(`/api/backtest/enhanced?${params.toString()}`, {
        method: 'POST',
      });
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
        <h3 className="text-lg font-semibold text-white mb-4">Enhanced Backtest</h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Symbol</label>
            <select
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
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
            <label className="block text-sm text-slate-400 mb-1">Strategy</label>
            <select
              value={form.strategy}
              onChange={(e) => setForm({ ...form, strategy: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              {STRATEGIES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
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
        </div>

        {/* Position Sizing Section */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h4 className="text-sm font-medium text-slate-400 mb-3">Position Sizing & Costs</h4>
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
                min="0.1"
                max="10"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Slippage (%)</label>
              <input
                type="number"
                value={form.slippagePct}
                onChange={(e) => setForm({ ...form, slippagePct: Number(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono"
                min="0"
                max="1"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Commission/Share ($)</label>
              <input
                type="number"
                value={form.commissionPerShare}
                onChange={(e) => setForm({ ...form, commissionPerShare: Number(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono"
                min="0"
                max="0.1"
                step="0.001"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Running Backtest...' : 'Run Enhanced Backtest'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
      </form>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary Header */}
          <div className="bg-slate-800/70 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {result.symbol} - {STRATEGIES.find(s => s.value === result.strategy)?.label || result.strategy}
                </h3>
                <div className="text-sm text-slate-400">
                  {result.period?.start} to {result.period?.end} ({result.period?.bars?.toLocaleString()} bars)
                </div>
              </div>
              <CopyButton
                label="Copy Results"
                getText={async () => {
                  return `## Backtest Results: ${result.symbol} - ${result.strategy}

### Performance
- Total Return: ${result.total_return_pct?.toFixed(2)}%
- Final Equity: $${result.final_equity?.toLocaleString()}

### Risk Metrics
- Sharpe Ratio: ${result.risk_metrics?.sharpe_ratio?.toFixed(2)}
- Sortino Ratio: ${result.risk_metrics?.sortino_ratio?.toFixed(2)}
- Max Drawdown: ${result.risk_metrics?.max_drawdown_pct?.toFixed(1)}%
- Calmar Ratio: ${result.risk_metrics?.calmar_ratio?.toFixed(2)}

### Trade Statistics
- Total Trades: ${result.stats?.total_trades}
- Win Rate: ${result.stats?.win_rate?.toFixed(1)}%
- Profit Factor: ${result.stats?.profit_factor?.toFixed(2)}
- Expectancy: $${result.stats?.expectancy?.toFixed(2)}/trade
- Win Streak: ${result.stats?.win_streak} | Loss Streak: ${result.stats?.loss_streak}`;
                }}
              />
            </div>

            {/* Main Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-sm text-slate-400">Trades</div>
                <div className="text-xl font-mono font-bold text-white">{result.stats?.total_trades}</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-sm text-slate-400">Win Rate</div>
                <div className={`text-xl font-mono font-bold ${result.stats?.win_rate > 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {result.stats?.win_rate?.toFixed(1)}%
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-sm text-slate-400">Profit Factor</div>
                <div className={`text-xl font-mono font-bold ${result.stats?.profit_factor > 1.5 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {result.stats?.profit_factor?.toFixed(2)}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-sm text-slate-400">Total P&L</div>
                <div className={`text-xl font-mono font-bold ${result.stats?.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPnl(result.stats?.total_pnl)}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-sm text-slate-400">Return</div>
                <div className={`text-xl font-mono font-bold ${result.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {result.total_return_pct >= 0 ? '+' : ''}{result.total_return_pct?.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Metrics Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Equity Chart */}
            <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
              <EquityChart data={result.equity_curve} />
            </div>

            {/* Risk Metrics */}
            <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
              <RiskMetricsCard metrics={result.risk_metrics} />
            </div>
          </div>

          {/* Trade Statistics */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
              <TradeStatsCard stats={result.stats} />
            </div>

            {/* Costs Summary */}
            <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-3">Trading Costs</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Commission</span>
                    <span className="font-mono text-red-400">-${result.stats?.total_commission?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Slippage</span>
                    <span className="font-mono text-red-400">-${result.stats?.total_slippage?.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-600 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Win</span>
                      <span className="font-mono text-green-400">{formatPnl(result.stats?.avg_win)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Loss</span>
                      <span className="font-mono text-red-400">{formatPnl(-result.stats?.avg_loss)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Trades Table */}
          {result.trades && result.trades.length > 0 && (
            <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
              <h4 className="text-sm font-medium text-slate-400 mb-3">Recent Trades (last 10)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="text-left py-2 px-2">Entry</th>
                      <th className="text-left py-2 px-2">Exit</th>
                      <th className="text-right py-2 px-2">Entry $</th>
                      <th className="text-right py-2 px-2">Exit $</th>
                      <th className="text-right py-2 px-2">Qty</th>
                      <th className="text-right py-2 px-2">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {result.trades.slice(-10).reverse().map((trade, idx) => (
                      <tr key={idx} className="hover:bg-slate-700/30">
                        <td className="py-2 px-2 font-mono text-xs">{trade.entry_time?.slice(0, 16)}</td>
                        <td className="py-2 px-2 font-mono text-xs">{trade.exit_time?.slice(0, 16)}</td>
                        <td className="py-2 px-2 text-right font-mono">${trade.entry_price}</td>
                        <td className="py-2 px-2 text-right font-mono">${trade.exit_price}</td>
                        <td className="py-2 px-2 text-right font-mono">{trade.qty}</td>
                        <td className={`py-2 px-2 text-right font-mono font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPnl(trade.pnl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
