import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

function TradeDetailView({ tradeId, onBack }) {
  const api = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await api.fetchApi(`/api/trades/${encodeURIComponent(tradeId)}`);
        setData(result);
      } catch (e) {
        console.error('Failed to load trade:', e);
      }
      setLoading(false);
    };
    load();
  }, [tradeId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-400">Trade not found</div>;
  }

  const { trade, related_trades, stats } = data;
  const isPositive = (trade.pnl || 0) >= 0;

  const copyTradeDetail = async () => {
    const text = `## Trade Detail
**Symbol:** ${trade.symbol}
**Bot:** ${trade.bot_name}
**Side:** ${trade.side?.toUpperCase()}
**Entry:** $${trade.entry_price} at ${trade.timestamp}
**Exit:** $${trade.exit_price}
**P&L:** ${isPositive ? '+' : ''}$${trade.pnl?.toFixed(2)} (${trade.pnl_pct?.toFixed(2)}%)
**Exit Reason:** ${trade.exit_reason}
**Strategy:** ${trade.strategy || 'N/A'}`;
    await navigator.clipboard.writeText(text);
  };

  const formatDate = (ts) => {
    if (!ts) return '--';
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (ts) => {
    if (!ts) return '--';
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2">
          <span>←</span> Back to Trades
        </button>
        <button
          onClick={copyTradeDetail}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm"
        >
          📋 Copy to Claude
        </button>
      </div>

      {/* Trade Summary */}
      <div className="bg-slate-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{trade.symbol}</h2>
            <div className="text-slate-400">{trade.side?.toUpperCase()} • {trade.bot_name}</div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}${Math.abs(trade.pnl || 0).toFixed(2)}
            </div>
            <div className={`text-sm ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
              {isPositive ? '+' : ''}{(trade.pnl_pct || 0).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Entry</div>
          <div className="text-lg font-mono text-white">${trade.entry_price || 0}</div>
          <div className="text-xs text-slate-500">{formatTime(trade.timestamp)}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Exit</div>
          <div className="text-lg font-mono text-white">${trade.exit_price || 0}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Quantity</div>
          <div className="text-lg font-mono text-white">{trade.qty || 0}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Exit Reason</div>
          <div className="text-lg text-white">{trade.exit_reason || 'N/A'}</div>
        </div>
      </div>

      {/* Related Trades History */}
      <div className="bg-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white">Trade History: {trade.bot_name} × {trade.symbol}</h3>
          <div className="text-sm text-slate-400">
            {stats.total_fires} trades • {stats.win_rate}% win rate • ${stats.total_pnl?.toFixed(2)} total
          </div>
        </div>

        {related_trades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Date</th>
                  <th className="pb-2 text-right">Entry</th>
                  <th className="pb-2 text-right">Exit</th>
                  <th className="pb-2 text-right">P&L</th>
                  <th className="pb-2">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {related_trades.map((t, i) => {
                  const tPositive = (t.pnl || 0) >= 0;
                  return (
                    <tr key={i} className="hover:bg-slate-700/50">
                      <td className="py-2">{formatDate(t.timestamp)}</td>
                      <td className="py-2 text-right font-mono">${t.entry_price || 0}</td>
                      <td className="py-2 text-right font-mono">${t.exit_price || 0}</td>
                      <td className={`py-2 text-right font-mono ${tPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {tPositive ? '+' : ''}${(t.pnl || 0).toFixed(2)}
                      </td>
                      <td className="py-2 text-slate-400">{t.exit_reason || '--'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-slate-500 text-center py-4">No related trades found</div>
        )}
      </div>
    </div>
  );
}

export function TradesTab({ bots }) {
  const api = useApi();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTradeId, setSelectedTradeId] = useState(null);
  const [filters, setFilters] = useState({ bot: '', symbol: '', status: 'all' });

  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.bot) params.append('bot', filters.bot);
        if (filters.symbol) params.append('symbol', filters.symbol);
        if (filters.status !== 'all') params.append('status', filters.status);
        params.append('limit', '100');

        const result = await api.fetchApi(`/api/trades?${params.toString()}`);
        setTrades(result.trades || []);
      } catch (e) {
        console.error('Failed to load trades:', e);
      }
      setLoading(false);
    };
    load();
  }, [filters]);

  const copyTrade = async (trade) => {
    const isPositive = (trade.pnl || 0) >= 0;
    const text = `${trade.symbol} ${trade.side?.toUpperCase()} | ${isPositive ? '+' : ''}$${(trade.pnl || 0).toFixed(2)} | ${trade.bot_name}`;
    await navigator.clipboard.writeText(text);
  };

  const formatTime = (ts) => {
    if (!ts) return '--';
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (selectedTradeId) {
    return <TradeDetailView tradeId={selectedTradeId} onBack={() => setSelectedTradeId(null)} />;
  }

  const symbols = [...new Set(trades.map(t => t.symbol).filter(Boolean))];

  return (
    <div className="p-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filters.bot}
          onChange={e => setFilters({ ...filters, bot: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
        >
          <option value="">All Bots</option>
          {(bots || []).map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={filters.symbol}
          onChange={e => setFilters({ ...filters, symbol: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
        >
          <option value="">All Symbols</option>
          {symbols.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
        >
          <option value="all">All Trades</option>
          <option value="winners">Winners Only</option>
          <option value="losers">Losers Only</option>
        </select>
      </div>

      {/* Trade List */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading trades...</div>
      ) : trades.length === 0 ? (
        <div className="text-center py-8 text-slate-400">No trades found</div>
      ) : (
        <div className="space-y-2">
          {trades.map(trade => {
            const isPositive = (trade.pnl || 0) >= 0;
            return (
              <div
                key={trade.id}
                onClick={() => setSelectedTradeId(trade.id)}
                className="p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl">{isPositive ? '✅' : '❌'}</span>
                  <div>
                    <div className="font-medium text-white">{trade.symbol}</div>
                    <div className="text-sm text-slate-500">
                      {trade.bot_name} • {formatTime(trade.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-mono font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}${Math.abs(trade.pnl || 0).toFixed(2)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyTrade(trade); }}
                    className="text-slate-500 hover:text-slate-300 p-1"
                    title="Copy trade"
                  >
                    📋
                  </button>
                  <span className="text-slate-500">→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
