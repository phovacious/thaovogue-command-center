import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { UnifiedDetailCard } from './UnifiedDetailCard';
import { formatTradeDate, formatTradeTime } from '../utils/parseDate';
import StrategyDetailModal from './StrategyDetailModal';

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

  // Calculate capital and risk for SPX trades
  const contracts = trade.contracts || trade.qty || 1;
  const spreadWidth = trade.spread_width || 5; // Default 5pt spread
  const maxLossPerContract = 350; // $500 spread - $150 credit typical

  // Account capital (from bot config)
  const accountCapital = trade.account_capital || 25000; // Default $25k shadow capital

  // Compute values if not provided by API
  const capitalUsed = trade.capital_used || (spreadWidth * 100 * contracts);
  const riskAmount = trade.risk_amount || (maxLossPerContract * contracts);
  const returnOnRisk = trade.return_on_risk || (riskAmount > 0 ? ((trade.pnl || 0) / riskAmount * 100).toFixed(1) : 0);
  const pctOfCapital = accountCapital > 0 ? (riskAmount / accountCapital * 100) : 0;

  const copyTradeDetail = async () => {
    const text = `## Trade Detail
**Symbol:** ${trade.symbol}
**Bot:** ${trade.bot_name}
**Side:** ${trade.side?.toUpperCase()}
**Entry:** $${(trade.entry_price || 0).toFixed(2)} at ${trade.timestamp}
**Exit:** $${(trade.exit_price || 0).toFixed(2)}
**P&L:** ${isPositive ? '+' : ''}$${trade.pnl?.toFixed(2)} (${trade.pnl_pct?.toFixed(2)}%)
**Exit Reason:** ${trade.exit_reason}
**Strategy:** ${trade.strategy || 'N/A'}`;
    await navigator.clipboard.writeText(text);
  };

  // Using imported formatTradeDate and formatTradeTime from utils/parseDate

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

      {/* Capital Overview Card */}
      <div className="bg-slate-800 rounded-xl p-4 mb-4 border border-slate-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-slate-400 text-sm mb-1">Account Capital</div>
            <div className="text-xl font-mono font-bold text-white">${accountCapital.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-400 text-sm mb-1">Margin Used</div>
            <div className="text-lg font-mono text-white">${capitalUsed.toLocaleString()}</div>
            <div className="text-xs text-slate-500">{spreadWidth}pt × {contracts}</div>
          </div>
          <div>
            <div className="text-slate-400 text-sm mb-1">Max Risk</div>
            <div className="text-lg font-mono text-white">${riskAmount.toLocaleString()}</div>
            <div className="text-xs text-slate-500">${maxLossPerContract} × {contracts}</div>
          </div>
          <div>
            <div className="text-slate-400 text-sm mb-1">% of Capital</div>
            <div className="text-xl font-mono font-bold text-cyan-400">{pctOfCapital.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Details Grid - Row 1: P&L Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Return on Risk</div>
          <div className={`text-lg font-mono ${returnOnRisk >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {returnOnRisk >= 0 ? '+' : ''}{returnOnRisk}%
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Hold Duration</div>
          <div className="text-lg text-white">{trade.hold_duration || 'EOD'}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Strike Distance</div>
          <div className="text-lg text-white">{trade.strike_distance || 'N/A'}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Exit Reason</div>
          <div className="text-lg text-white capitalize">{trade.exit_reason || 'N/A'}</div>
        </div>
      </div>

      {/* Details Grid - Row 2: Trade Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Entry Price</div>
          <div className="text-lg font-mono text-white">${(trade.entry_price || 0).toFixed(2)}</div>
          <div className="text-xs text-slate-500">{trade.entry_time || formatTradeTime(trade.timestamp)}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Exit Price</div>
          <div className="text-lg font-mono text-white">
            ${(trade.exit_price || 0).toFixed(2)}
            {trade.exit_calculated && (
              <span className="ml-1 text-yellow-400" title="Calculated from P&L">⚡</span>
            )}
          </div>
          <div className="text-xs text-slate-500">{trade.exit_time || '--'}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Entry Window</div>
          <div className="text-lg text-white">{trade.entry_window || '13:00 ET'}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Target</div>
          <div className="text-lg text-white">{trade.target_pct || '100%'}</div>
        </div>
      </div>

      {/* Details Grid - Row 3: Strategy Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Contracts</div>
          <div className="text-lg font-mono text-white">{trade.contracts || trade.qty || 1}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Entry Window</div>
          <div className="text-lg text-white">{trade.entry_window || 'N/A'}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Target</div>
          <div className="text-lg text-white">{trade.target_pct || 'N/A'}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Strategy</div>
          <div className="text-lg text-white">{trade.strategy || 'Credit Spread'}</div>
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
                      <td className="py-2">{formatTradeDate(t.timestamp)}</td>
                      <td className="py-2 text-right font-mono">${(t.entry_price || 0).toFixed(2)}</td>
                      <td className="py-2 text-right font-mono">
                        ${(t.exit_price || 0).toFixed(2)}
                        {t.exit_calculated && <span className="ml-1 text-yellow-400" title="Calculated">⚡</span>}
                      </td>
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
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
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

  // Using imported formatTradeTime from utils/parseDate

  if (selectedTradeId) {
    return <TradeDetailView tradeId={selectedTradeId} onBack={() => setSelectedTradeId(null)} />;
  }

  const symbols = [...new Set(trades.map(t => t.symbol).filter(Boolean))];
  const strategies = [...new Set(trades.map(t => t.strategy).filter(Boolean))].sort();

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

        {/* Strategy Chips - Click to view all trades for that strategy */}
        {strategies.length > 0 && (
          <div className="flex flex-wrap gap-2 w-full mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="text-cyan-400 text-sm py-1 font-medium">📊 Strategies:</span>
            {strategies.slice(0, 10).map(strat => (
              <button
                key={strat}
                onClick={() => setSelectedStrategy(strat)}
                className="cursor-pointer px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full text-xs font-bold shadow-lg hover:shadow-purple-500/25 transition-all duration-200 border border-purple-400/50 active:scale-95"
              >
                {strat}
              </button>
            ))}
            {strategies.length > 10 && (
              <span className="text-slate-400 text-xs py-1.5">+{strategies.length - 10} more</span>
            )}
          </div>
        )}
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
                onClick={() => setSelectedTrade(trade)}
                className="p-4 bg-slate-800 rounded-lg flex items-center justify-between select-none border-2 border-transparent hover:bg-slate-700 cursor-pointer active:bg-cyan-500/20"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-xl">
                    {trade.trade_status === 'INCOMPLETE' ? '⏳' : isPositive ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-white">
                      {trade.symbol}
                      {trade.trade_status === 'INCOMPLETE' && (
                        <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">OPEN</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {trade.bot_name} • {formatTradeTime(trade.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}${Math.abs(trade.pnl || 0).toFixed(2)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyTrade(trade); }}
                    className="text-slate-500 hover:text-slate-300 p-2 active:bg-slate-600 rounded"
                    title="Copy trade"
                  >
                    📋
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedTradeId(trade.id); }}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-sm rounded-lg font-medium"
                  >
                    Full View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Trade Detail Modal */}
      {selectedTrade && (
        <UnifiedDetailCard
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onStrategyClick={(strategy) => {
            setSelectedTrade(null);
            setSelectedStrategy(strategy);
          }}
        />
      )}

      {/* Strategy Detail Modal */}
      {selectedStrategy && (
        <StrategyDetailModal
          strategy={selectedStrategy}
          trades={trades}
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
