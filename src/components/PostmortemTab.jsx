import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

function SummaryCard({ label, value, subLabel, color }) {
  const colorClass = color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : 'text-white';

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="text-sm text-slate-400 mb-1">{label}</div>
      <div className={`text-2xl font-mono font-bold ${colorClass}`}>{value}</div>
      {subLabel && <div className="text-xs text-slate-500 mt-1">{subLabel}</div>}
    </div>
  );
}

export function PostmortemTab() {
  const api = useApi();
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await api.fetchApi(`/api/postmortem/summary/${selectedDate}`);
        setSummary(result);
      } catch (e) {
        console.error('Failed to load summary:', e);
        setSummary(null);
      }
      setLoading(false);
    };
    load();
  }, [selectedDate]);

  const formatTime = (ts) => {
    if (!ts) return '--';
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const copyReportForClaude = async () => {
    if (!summary) return;

    const text = `## Daily Trading Report - ${selectedDate}

**Total P&L:** ${summary.total_pnl >= 0 ? '+' : ''}$${summary.total_pnl?.toFixed(2)}
**Trades:** ${summary.total_trades}
**Win Rate:** ${summary.win_rate}%

### Best Trade
${summary.best_trade ? `${summary.best_trade.symbol}: +$${summary.best_trade.pnl?.toFixed(2)}` : 'N/A'}

### Worst Trade
${summary.worst_trade ? `${summary.worst_trade.symbol}: $${summary.worst_trade.pnl?.toFixed(2)}` : 'N/A'}

### P&L by Bot
${summary.pnl_by_bot?.map(b => `- ${b.name}: ${b.pnl >= 0 ? '+' : ''}$${b.pnl?.toFixed(2)} (${b.trades} trades)`).join('\n') || 'N/A'}

### P&L by Symbol
${summary.pnl_by_symbol?.map(s => `- ${s.symbol}: ${s.pnl >= 0 ? '+' : ''}$${s.pnl?.toFixed(2)} (${s.trades} trades)`).join('\n') || 'N/A'}`;

    await navigator.clipboard.writeText(text);
  };

  const isPositive = (summary?.total_pnl || 0) >= 0;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">📊 Daily Postmortem</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading...</div>
      ) : !summary || summary.total_trades === 0 ? (
        <div className="text-center py-8 text-slate-400">No trades on {selectedDate}</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <SummaryCard
              label="Total P&L"
              value={`${isPositive ? '+' : ''}$${Math.abs(summary.total_pnl || 0).toFixed(2)}`}
              color={isPositive ? 'green' : 'red'}
            />
            <SummaryCard label="Trades" value={summary.total_trades} />
            <SummaryCard label="Win Rate" value={`${summary.win_rate}%`} />
            <SummaryCard
              label="Best Trade"
              value={`+$${summary.best_trade?.pnl?.toFixed(2) || 0}`}
              subLabel={summary.best_trade?.symbol}
              color="green"
            />
            <SummaryCard
              label="Worst Trade"
              value={`$${summary.worst_trade?.pnl?.toFixed(2) || 0}`}
              subLabel={summary.worst_trade?.symbol}
              color="red"
            />
          </div>

          {/* P&L by Bot */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-white mb-4">P&L by Bot</h3>
            <div className="space-y-2">
              {summary.pnl_by_bot?.map(bot => {
                const botPositive = (bot.pnl || 0) >= 0;
                return (
                  <div key={bot.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                    <span className="text-white">{bot.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500 text-sm">{bot.trades} trades</span>
                      <span className={`font-mono font-medium ${botPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {botPositive ? '+' : ''}${(bot.pnl || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* P&L by Symbol */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-white mb-4">P&L by Symbol</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {summary.pnl_by_symbol?.map(sym => {
                const symPositive = (sym.pnl || 0) >= 0;
                return (
                  <div key={sym.symbol} className="bg-slate-700/50 rounded-lg p-3">
                    <div className="font-medium text-white">{sym.symbol}</div>
                    <div className={`font-mono ${symPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {symPositive ? '+' : ''}${(sym.pnl || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500">{sym.trades} trades</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trade Timeline */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-white mb-4">Trade Timeline</h3>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {summary.trades?.map((trade, i) => {
                const tradePositive = (trade.pnl || 0) >= 0;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 py-2 border-b border-slate-700/50 last:border-0"
                  >
                    <span className="text-slate-500 font-mono text-sm w-16">{formatTime(trade.timestamp)}</span>
                    <span>{tradePositive ? '✅' : '❌'}</span>
                    <span className="font-medium text-white">{trade.symbol}</span>
                    <span className="text-slate-500 text-sm">{trade.bot_name}</span>
                    <span className={`ml-auto font-mono ${tradePositive ? 'text-green-400' : 'text-red-400'}`}>
                      {tradePositive ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="font-medium text-white mb-4">Daily Report</h3>
            <p className="text-slate-500 mb-4">Generate a report for {selectedDate}</p>
            <div className="flex gap-4">
              <button
                onClick={copyReportForClaude}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
              >
                📋 Copy for Claude
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
