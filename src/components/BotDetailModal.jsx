import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { UnifiedDetailCard } from './UnifiedDetailCard';

// Bot display name mapping - includes symbols for clarity
const BOT_DISPLAY_NAMES = {
  // Equity Bots - with their symbols
  'BOT_A': 'Alpha (NVDA/TSLA/AMD)',
  'BOT_B': 'Beta (PLTR/META/GOOG)',
  'BOT_C': 'Charlie (AAPL/SMCI/COIN)',
  'A': 'Alpha (NVDA/TSLA/AMD)',
  'B': 'Beta (PLTR/META/GOOG)',
  'C': 'Charlie (AAPL/SMCI/COIN)',

  // SPX Bots - with spread width
  'BOT_SPX_A': 'SPX Alpha (VIX-adaptive)',
  'BOT_SPX_B': 'SPX Beta (35pt aggressive)',
  'BOT_SPX_C': 'SPX Charlie (40pt)',
  'BOT_SPX_D': 'SPX Delta (45pt)',
  'BOT_SPX_E': 'SPX Echo (40pt quick exit)',
  'BOT_SPX_F': 'SPX Foxtrot (35pt)',
  'BOT_SPX_G': 'SPX Golf (70pt Crown Jewels)',
  'BOT_SPX_H': 'SPX Hotel (55pt Goldilocks)',
  'SPX_A': 'SPX Alpha (VIX-adaptive)',
  'SPX_B': 'SPX Beta (35pt aggressive)',
  'SPX_C': 'SPX Charlie (40pt)',
  'SPX_D': 'SPX Delta (45pt)',
  'SPX_E': 'SPX Echo (40pt quick exit)',
  'SPX_F': 'SPX Foxtrot (35pt)',
  'SPX_G': 'SPX Golf (70pt Crown Jewels)',
  'SPX_H': 'SPX Hotel (55pt Goldilocks)',

  // SPX Variants
  'BOT_SPX_A_LADDER': 'SPX Alpha Ladder',
  'BOT_SPX_A_SCALPER': 'SPX Alpha Scalper',
  'BOT_SPX_F_SCALPER': 'SPX Foxtrot Scalper',
  'BOT_SPX_F_SEQUENTIAL': 'SPX Foxtrot Sequential',
  'BOT_SPX_CALL_A': 'SPX Call Alpha',

  // Dynamic Bots
  'DYNAMIC_NUCLEAR': 'Dynamic Nuclear',
  'DYNAMIC_AGGRESSIVE': 'Dynamic Aggressive',
  'DYNAMIC_BIGDIP': 'Dynamic Big Dip',

  // Special Bots
  'GODMODE': 'God Mode',
  'HIGH_CONVICTION': 'High Conviction',
  'HIGH_CONVICTION_SWING': 'HC Swing',
  'ULTRA_PRINTER': 'Ultra Printer',
  'ULTRA_EQUITY': 'Ultra Equity',
  'WALKFORWARD': 'Walk Forward',
  'CRYPTO_ORB': 'Crypto ORB (BTC/ETH)',
};

function getBotDisplayName(botId) {
  if (!botId) return 'Unknown';
  const normalized = botId.toUpperCase();
  return BOT_DISPLAY_NAMES[normalized] || BOT_DISPLAY_NAMES[normalized.replace('BOT_', '')] || botId;
}

export function BotDetailModal({ bot, onClose }) {
  const api = useApi();
  const [trades, setTrades] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const botId = bot.name || bot.id || '';
  const displayName = getBotDisplayName(botId);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const data = await api.fetchApi(`/api/bots/${encodeURIComponent(botId)}/trades`);
        setTrades(data.trades || []);
        setStats(data.stats || {});
      } catch (err) {
        console.error('Error fetching bot trades:', err);
      }
      setLoading(false);
    };

    fetchTrades();
  }, [botId]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800 rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white truncate">{botId}</h2>
            <p className="text-slate-400 text-sm truncate">{displayName}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white text-2xl rounded-full hover:bg-slate-700"
          >
            ×
          </button>
        </div>

        {/* Bot Info */}
        <div className="px-3 py-3 border-b border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-slate-700/50 rounded p-2 text-center">
              <div className="text-xs text-slate-500">Status</div>
              <div className={`font-bold text-sm ${
                bot.status === 'RUNNING' || bot.status === 'ACTIVE'
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>
                {bot.status || 'UNKNOWN'}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded p-2 text-center">
              <div className="text-xs text-slate-500">Type</div>
              <div className="text-white text-sm">{bot.type || '--'}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-2 text-center col-span-2 md:col-span-1">
              <div className="text-xs text-slate-500">Symbols</div>
              <div className="text-xs text-white truncate">
                {Array.isArray(bot.symbols) ? bot.symbols.join(', ') : bot.symbols || '--'}
              </div>
            </div>
            <div className="hidden md:block bg-slate-700/50 rounded p-2 text-center">
              <div className="text-xs text-slate-500">PID</div>
              <div className="font-mono text-xs text-white">{bot.pid || '--'}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="px-3 py-3 border-b border-slate-700">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              <div className="bg-slate-700/50 rounded p-2 text-center">
                <div className="text-xs text-slate-500">Closed</div>
                <div className="text-lg font-bold text-white">{stats.total_trades || 0}</div>
              </div>
              {(stats.open_positions || 0) > 0 && (
                <div className="bg-yellow-500/20 rounded p-2 text-center">
                  <div className="text-xs text-yellow-400">Open</div>
                  <div className="text-lg font-bold text-yellow-300">{stats.open_positions}</div>
                </div>
              )}
              <div className="bg-slate-700/50 rounded p-2 text-center">
                <div className="text-xs text-slate-500">Win Rate</div>
                <div className={`text-lg font-bold ${
                  (stats.win_rate || 0) >= 50 ? 'text-green-400' : (stats.total_trades || 0) === 0 ? 'text-slate-400' : 'text-red-400'
                }`}>
                  {stats.total_trades > 0 ? `${stats.win_rate || 0}%` : '--'}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded p-2 text-center">
                <div className="text-xs text-slate-500">Total P&L</div>
                <div className={`text-base font-bold font-mono ${
                  (stats.total_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stats.total_trades > 0 ? `${(stats.total_pnl || 0) >= 0 ? '+' : ''}$${(stats.total_pnl || 0).toFixed(0)}` : '--'}
                </div>
              </div>
              <div className="hidden md:block bg-slate-700/50 rounded p-2 text-center">
                <div className="text-xs text-slate-500">Avg Win</div>
                <div className="text-green-400 font-mono text-sm">
                  {stats.wins > 0 ? `+$${(stats.avg_win || 0).toFixed(0)}` : '--'}
                </div>
              </div>
              <div className="hidden md:block bg-slate-700/50 rounded p-2 text-center">
                <div className="text-xs text-slate-500">Avg Loss</div>
                <div className="text-red-400 font-mono text-sm">
                  {stats.losses > 0 ? `$${(stats.avg_loss || 0).toFixed(0)}` : '--'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trade History */}
        <div className="flex-1 overflow-auto px-3 py-4">
          {loading ? (
            <div className="text-center text-slate-500 py-8">Loading trades...</div>
          ) : trades.length === 0 ? (
            <div className="text-center text-slate-500 py-8">No trades found for this bot</div>
          ) : (
            <>
              {/* Open Positions Section */}
              {(() => {
                const openPositions = trades.filter(t => !t.exit_price && t.pnl === undefined);
                if (openPositions.length === 0) return null;
                return (
                  <div className="mb-4">
                    <h3 className="font-semibold text-white mb-3 px-1 flex items-center gap-2">
                      Open Positions
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                        {openPositions.length}
                      </span>
                    </h3>
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full text-sm min-w-0">
                        <thead className="bg-yellow-500/10">
                          <tr>
                            <th className="hidden md:table-cell px-2 py-2 text-left text-slate-400 text-xs">Date</th>
                            <th className="px-2 py-2 text-left text-slate-400 text-xs">Symbol</th>
                            <th className="px-2 py-2 text-right text-slate-400 text-xs">Entry</th>
                            <th className="px-2 py-2 text-right text-slate-400 text-xs">Qty</th>
                            <th className="px-2 py-2 text-right text-slate-400 text-xs">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {openPositions.map((trade, i) => (
                            <tr
                              key={`open-${i}`}
                              onClick={() => setSelectedTrade(trade)}
                              className="border-t border-yellow-500/20 hover:bg-yellow-500/10 cursor-pointer"
                            >
                              <td className="hidden md:table-cell px-2 py-2 font-mono text-xs text-slate-300 whitespace-nowrap">
                                {trade.date || '--'}
                              </td>
                              <td className="px-2 py-2 text-white text-sm">{trade.symbol || '--'}</td>
                              <td className="px-2 py-2 text-right font-mono text-xs text-slate-300">
                                ${trade.entry_price?.toFixed(2) || '--'}
                              </td>
                              <td className="px-2 py-2 text-right font-mono text-xs text-slate-300">
                                {trade.qty || '--'}
                              </td>
                              <td className="px-2 py-2 text-right">
                                <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded font-medium">
                                  OPEN
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Closed Trades Section */}
              {(() => {
                const closedTrades = trades.filter(t => t.exit_price || t.pnl !== undefined);
                return (
                  <div>
                    <h3 className="font-semibold text-white mb-3 px-1 flex items-center gap-2">
                      Trade History
                      <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded-full">
                        {closedTrades.length} closed
                      </span>
                    </h3>
                    {closedTrades.length === 0 ? (
                      <div className="text-center text-slate-500 py-4">No closed trades yet</div>
                    ) : (
                      <div className="overflow-x-auto -mx-1">
                        <table className="w-full text-sm min-w-0">
                          <thead className="bg-slate-700/50 sticky top-0">
                            <tr>
                              <th className="hidden md:table-cell px-2 py-2 text-left text-slate-400 text-xs">Date</th>
                              <th className="px-2 py-2 text-left text-slate-400 text-xs">Symbol</th>
                              <th className="px-2 py-2 text-right text-slate-400 text-xs">Entry</th>
                              <th className="px-2 py-2 text-right text-slate-400 text-xs">Exit</th>
                              <th className="px-2 py-2 text-right text-slate-400 text-xs whitespace-nowrap">P&L</th>
                            </tr>
                          </thead>
                          <tbody>
                            {closedTrades.map((trade, i) => (
                              <tr
                                key={`closed-${i}`}
                                onClick={() => setSelectedTrade(trade)}
                                className="border-t border-slate-700/50 hover:bg-slate-700/30 cursor-pointer active:bg-cyan-500/20"
                              >
                                <td className="hidden md:table-cell px-2 py-2 font-mono text-xs text-slate-300 whitespace-nowrap">
                                  {trade.date || '--'}
                                </td>
                                <td className="px-2 py-2 text-white text-sm">{trade.symbol || '--'}</td>
                                <td className="px-2 py-2 text-right font-mono text-xs text-slate-300">
                                  ${trade.entry_price?.toFixed(0) || '--'}
                                </td>
                                <td className="px-2 py-2 text-right font-mono text-xs text-slate-300">
                                  {trade.exit_price ? (
                                    <>
                                      ${trade.exit_price.toFixed(0)}
                                      {trade.exit_calculated && (
                                        <span className="text-yellow-400 ml-0.5" title="Calculated">⚡</span>
                                      )}
                                    </>
                                  ) : '--'}
                                </td>
                                <td className={`px-2 py-2 text-right font-mono text-sm font-medium whitespace-nowrap ${
                                  (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {trade.pnl !== undefined ? (
                                    `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(0)}`
                                  ) : '--'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <UnifiedDetailCard
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
        />
      )}
    </div>
  );
}
