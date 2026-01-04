import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

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
  'BOT_SPX_B': 'SPX Beta (35pt spread)',
  'BOT_SPX_C': 'SPX Charlie (40pt spread)',
  'BOT_SPX_D': 'SPX Delta (45pt spread)',
  'BOT_SPX_E': 'SPX Echo (Quick Exit)',
  'BOT_SPX_F': 'SPX Foxtrot (Crown Jewels)',
  'BOT_SPX_G': 'SPX Golf (70pt Ultra-Wide)',
  'SPX_A': 'SPX Alpha (VIX-adaptive)',
  'SPX_B': 'SPX Beta (35pt spread)',
  'SPX_C': 'SPX Charlie (40pt spread)',
  'SPX_D': 'SPX Delta (45pt spread)',
  'SPX_E': 'SPX Echo (Quick Exit)',
  'SPX_F': 'SPX Foxtrot (Crown Jewels)',
  'SPX_G': 'SPX Golf (70pt Ultra-Wide)',

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
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">{botId}</h2>
            <p className="text-slate-400">{displayName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none px-2"
          >
            ×
          </button>
        </div>

        {/* Bot Info */}
        <div className="p-4 border-b border-slate-700">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-700/50 rounded p-3 text-center">
              <div className="text-xs text-slate-500">Status</div>
              <div className={`font-bold ${
                bot.status === 'RUNNING' || bot.status === 'ACTIVE'
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>
                {bot.status || 'UNKNOWN'}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded p-3 text-center">
              <div className="text-xs text-slate-500">Type</div>
              <div className="text-white">{bot.type || '--'}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-3 text-center">
              <div className="text-xs text-slate-500">Symbols</div>
              <div className="text-sm text-white truncate">
                {Array.isArray(bot.symbols) ? bot.symbols.join(', ') : bot.symbols || '--'}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded p-3 text-center">
              <div className="text-xs text-slate-500">PID</div>
              <div className="font-mono text-sm text-white">{bot.pid || '--'}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="p-4 border-b border-slate-700">
            <div className="grid grid-cols-5 gap-3">
              <div className="bg-slate-700/50 rounded p-3 text-center">
                <div className="text-xs text-slate-500">Trades</div>
                <div className="text-xl font-bold text-white">{stats.total_trades || 0}</div>
              </div>
              <div className="bg-slate-700/50 rounded p-3 text-center">
                <div className="text-xs text-slate-500">Win Rate</div>
                <div className={`text-xl font-bold ${
                  (stats.win_rate || 0) >= 50 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stats.win_rate || 0}%
                </div>
              </div>
              <div className="bg-slate-700/50 rounded p-3 text-center">
                <div className="text-xs text-slate-500">Total P&L</div>
                <div className={`text-xl font-bold ${
                  (stats.total_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(stats.total_pnl || 0) >= 0 ? '+' : ''}${(stats.total_pnl || 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded p-3 text-center">
                <div className="text-xs text-slate-500">Avg Win</div>
                <div className="text-green-400 font-mono">+${(stats.avg_win || 0).toFixed(2)}</div>
              </div>
              <div className="bg-slate-700/50 rounded p-3 text-center">
                <div className="text-xs text-slate-500">Avg Loss</div>
                <div className="text-red-400 font-mono">${(stats.avg_loss || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Trade History */}
        <div className="flex-1 overflow-auto p-4">
          <h3 className="font-semibold text-white mb-3">Trade History</h3>

          {loading ? (
            <div className="text-center text-slate-500 py-8">Loading trades...</div>
          ) : trades.length === 0 ? (
            <div className="text-center text-slate-500 py-8">No trades found for this bot</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-slate-400">Date</th>
                    <th className="px-3 py-2 text-left text-slate-400">Symbol</th>
                    <th className="px-3 py-2 text-right text-slate-400">Entry</th>
                    <th className="px-3 py-2 text-right text-slate-400">Exit</th>
                    <th className="px-3 py-2 text-right text-slate-400">P&L</th>
                    <th className="px-3 py-2 text-left text-slate-400">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, i) => (
                    <tr key={i} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-3 py-2 font-mono text-xs text-slate-300">
                        {trade.date || '--'}
                      </td>
                      <td className="px-3 py-2 text-white">{trade.symbol || '--'}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-300">
                        ${trade.entry_price?.toFixed(2) || '--'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-300">
                        {trade.exit_price ? (
                          <>
                            ${trade.exit_price.toFixed(2)}
                            {trade.exit_calculated && (
                              <span className="text-yellow-400 ml-1" title="Calculated from P&L">⚡</span>
                            )}
                          </>
                        ) : '--'}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono ${
                        (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.pnl !== undefined ? (
                          `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}`
                        ) : '--'}
                      </td>
                      <td className="px-3 py-2 text-slate-400 text-xs truncate max-w-[120px]">
                        {trade.exit_reason || trade.strategy || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
