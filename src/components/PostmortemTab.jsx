import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { UnifiedDetailCard } from './UnifiedDetailCard';
import StrategyDetailModal from './StrategyDetailModal';
import { formatTradeTime } from '../utils/parseDate';

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
  const [selectedBot, setSelectedBot] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [recentDays, setRecentDays] = useState([]);
  const [allTrades, setAllTrades] = useState([]);

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

  // Fetch recent days with trade data
  useEffect(() => {
    const fetchRecentDays = async () => {
      try {
        const result = await api.fetchApi('/api/trades?source=permanent&limit=500');
        const trades = result.trades || [];
        setAllTrades(trades);

        // Group by date and calculate summaries
        const byDate = {};
        trades.forEach(t => {
          const date = (t.entry_time || t.timestamp || '').slice(0, 10);
          if (!date) return;
          if (!byDate[date]) {
            byDate[date] = { date, trades: 0, pnl: 0, wins: 0 };
          }
          byDate[date].trades++;
          byDate[date].pnl += (t.pnl || 0);
          if ((t.pnl || 0) > 0) byDate[date].wins++;
        });

        const days = Object.values(byDate)
          .map(d => ({ ...d, winRate: d.trades > 0 ? (d.wins / d.trades * 100) : 0 }))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 14);

        setRecentDays(days);

        // Set selectedDate to most recent day with trades
        if (days.length > 0 && !summary) {
          setSelectedDate(days[0].date);
        }
      } catch (e) {
        console.error('Failed to fetch recent days:', e);
      }
    };
    fetchRecentDays();
  }, []);

  // Using imported formatTradeTime from utils/parseDate

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">📊 Daily Postmortem</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
        />
      </div>

      {/* Recent Days Summary Row */}
      {recentDays.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {recentDays.map(day => {
              const isSelected = day.date === selectedDate;
              const dayName = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`flex-shrink-0 px-4 py-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-cyan-600 border-cyan-400 text-white'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-medium">{dayName}</div>
                  <div className={`text-lg font-bold ${day.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {day.pnl >= 0 ? '+' : ''}${Math.abs(day.pnl).toFixed(0)}
                  </div>
                  <div className="text-xs opacity-70">{day.trades} trades • {day.winRate.toFixed(0)}%</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
                  <div
                    key={bot.id}
                    onClick={() => setSelectedBot(bot.name)}
                    className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0 cursor-pointer hover:bg-slate-700/50 rounded px-2 -mx-2 transition-colors"
                  >
                    <span className="text-white">{bot.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500 text-sm">{bot.trades} trades</span>
                      <span className={`font-mono font-medium ${botPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {botPositive ? '+' : ''}${(bot.pnl || 0).toFixed(2)}
                      </span>
                      <span className="text-slate-500">→</span>
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
                  <div
                    key={sym.symbol}
                    onClick={() => setSelectedSymbol(sym.symbol)}
                    className="bg-slate-700/50 rounded-lg p-3 cursor-pointer hover:bg-slate-600/50 transition-colors active:bg-cyan-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{sym.symbol}</span>
                      <span className="text-slate-500 text-xs">→</span>
                    </div>
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
                    onClick={() => setSelectedTrade(trade)}
                    className="flex items-center gap-4 py-2 border-b border-slate-700/50 last:border-0 cursor-pointer hover:bg-slate-700/30 rounded px-2 -mx-2 transition-colors"
                  >
                    <span className="text-slate-500 font-mono text-sm w-16">{formatTradeTime(trade.timestamp)}</span>
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

      {/* Bot Trades Modal */}
      {selectedBot && (
        <FilteredTradesModal
          title={`Trades for ${selectedBot}`}
          trades={summary?.trades?.filter(t => t.bot_name === selectedBot) || []}
          onClose={() => setSelectedBot(null)}
          onTradeClick={setSelectedTrade}
        />
      )}

      {/* Symbol Trades Modal */}
      {selectedSymbol && (
        <FilteredTradesModal
          title={`Trades for ${selectedSymbol}`}
          trades={summary?.trades?.filter(t => t.symbol === selectedSymbol) || []}
          onClose={() => setSelectedSymbol(null)}
          onTradeClick={setSelectedTrade}
        />
      )}

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <UnifiedDetailCard
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onStrategyClick={(strat) => {
            setSelectedTrade(null);
            setSelectedStrategy(strat);
          }}
        />
      )}

      {/* Strategy Detail Modal */}
      {selectedStrategy && (
        <StrategyDetailModal
          strategy={selectedStrategy}
          trades={allTrades}
          onClose={() => setSelectedStrategy(null)}
          onTradeClick={(trade) => {
            setSelectedStrategy(null);
            setSelectedTrade(trade);
          }}
        />
      )}
    </div>
  );
}

// Reusable modal for filtered trades
function FilteredTradesModal({ title, trades, onClose, onTradeClick }) {
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const wins = trades.filter(t => (t.pnl || 0) >= 0).length;
  const losses = trades.length - wins;
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : 0;
  const isPositive = totalPnl >= 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 p-4 bg-slate-700/30">
          <div className="text-center">
            <div className="text-xs text-slate-400">Total P&L</div>
            <div className={`font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}${totalPnl.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Trades</div>
            <div className="font-mono font-bold text-white">{trades.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Win/Loss</div>
            <div className="font-mono font-bold">
              <span className="text-green-400">{wins}</span>
              <span className="text-slate-500">/</span>
              <span className="text-red-400">{losses}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Win Rate</div>
            <div className="font-mono font-bold text-white">{winRate}%</div>
          </div>
        </div>

        {/* Trades List */}
        <div className="overflow-y-auto max-h-[50vh] p-4">
          {trades.length === 0 ? (
            <div className="text-center text-slate-400 py-8">No trades found</div>
          ) : (
            <div className="space-y-2">
              {trades.map((trade, i) => {
                const tradePositive = (trade.pnl || 0) >= 0;
                return (
                  <div
                    key={i}
                    onClick={() => onTradeClick(trade)}
                    className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-600/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span>{tradePositive ? '✅' : '❌'}</span>
                      <div>
                        <div className="font-medium text-white">{trade.symbol}</div>
                        <div className="text-xs text-slate-400">
                          {formatTradeTime(trade.timestamp)} • {trade.bot_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-medium ${tradePositive ? 'text-green-400' : 'text-red-400'}`}>
                        {tradePositive ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                      </div>
                      {trade.pnl_pct && (
                        <div className={`text-xs ${tradePositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
                          {tradePositive ? '+' : ''}{trade.pnl_pct.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
