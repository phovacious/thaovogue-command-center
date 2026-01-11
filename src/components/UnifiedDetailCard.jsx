import { useState, useEffect } from 'react';
import { parseTradeDate, formatTradeTime, formatTradeDateTime } from '../utils/parseDate';

// Strategy color map for visual differentiation
const STRATEGY_COLORS = {
  'SRx 2.0': 'bg-cyan-600',
  'BOS FVG Scalper': 'bg-purple-600',
  '5Min Low Retest': 'bg-green-600',
  'Afternoon Continuation': 'bg-yellow-600',
  'RSI Dip Buy': 'bg-pink-600',
  'EMA Volume Trend': 'bg-blue-600',
  'Whole Dollar Trap': 'bg-orange-600',
  'SPX Credit Spread': 'bg-red-600',
  'Put Credit Spread': 'bg-red-600',
  'Equity Day Trade': 'bg-slate-600',
  'Triple Threat v3': 'bg-indigo-600',
  'Nitro+': 'bg-emerald-600',
  'High Conviction': 'bg-amber-600',
  'GodMode': 'bg-violet-600',
  'ORB': 'bg-teal-600',
  'Retest Fade': 'bg-rose-600',
  'Low Vol Micro Wheel': 'bg-lime-600',
};

// SPX bot strike distance mapping (actual config values)
const SPX_STRIKE_DISTANCES = {
  'SPX_A': '45pt',
  'SPX_B': '35pt',
  'SPX_C': '40pt',
  'SPX_D': '45pt',
  'SPX_E': '40pt',  // NOT 35pt - verified from bot_spx_e_v1.py
  'SPX_F': '35pt',
  'SPX_G': '70pt',  // Crown Jewels
  'SPX_H': '55pt',  // Goldilocks
  'SPX_CONSERVATIVE': '60pt',
  'SPX_RECYCLER': '45pt',
};

const getStrikeDistanceForBot = (botName) => {
  if (!botName) return '45pt';
  const upper = botName.toUpperCase().replace('BOT_', '');
  // Check exact match first
  if (SPX_STRIKE_DISTANCES[upper]) return SPX_STRIKE_DISTANCES[upper];
  // Check partial match (e.g., SPX_A_SCALPER -> SPX_A)
  for (const [key, value] of Object.entries(SPX_STRIKE_DISTANCES)) {
    if (upper.startsWith(key)) return value;
  }
  return '45pt'; // Default fallback
};

const getStrategyColor = (strategy) => {
  if (!strategy) return 'bg-slate-600';
  // Check for exact match first
  if (STRATEGY_COLORS[strategy]) return STRATEGY_COLORS[strategy];
  // Check for partial match (e.g., "Put Credit Spread @ 5900")
  for (const [key, color] of Object.entries(STRATEGY_COLORS)) {
    if (strategy.includes(key)) return color;
  }
  return 'bg-slate-600';
};

/**
 * UnifiedDetailCard - Unified trade detail modal used across all tabs
 * Adapts to trade type (SPX vs Equity) and shows all available fields
 */
export function UnifiedDetailCard({ trade, onClose, onStrategyClick }) {
  if (!trade) return null;

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const isPositive = (trade.pnl || 0) >= 0;
  const isSPX = trade.symbol === 'SPX' || trade.bot_name?.includes('SPX') || trade.bot_id?.includes('SPX');

  // Extract values with sensible defaults
  const contracts = trade.contracts || trade.qty || 1;
  const spreadWidth = trade.spread_width || 5; // Default 5pt spread for SPX

  // Account capital (from trade or default)
  const accountCapital = trade.account_capital || (isSPX ? 25000 : 10000);

  // Calculate capital and risk
  const maxLossPerContract = isSPX ? 350 : (trade.entry_price || 100) * contracts;
  const capitalUsed = isSPX ? (spreadWidth * 100 * contracts) : (trade.entry_price || 0) * contracts;
  const riskAmount = trade.risk_amount || (isSPX ? (maxLossPerContract * contracts) : Math.abs(trade.entry_price || 0) * contracts * 0.05);
  const returnOnRisk = riskAmount > 0 ? ((trade.pnl || 0) / riskAmount * 100) : 0;
  const pctOfCapital = accountCapital > 0 ? (riskAmount / accountCapital * 100) : 0;

  // Calculate hold duration using imported parseTradeDate
  const calculateDuration = () => {
    if (trade.hold_duration) return trade.hold_duration;
    if (!trade.entry_time && !trade.timestamp) return '--';
    if (!trade.exit_time) return 'Open';

    try {
      const entryTime = trade.entry_time || trade.timestamp;
      const exitTime = trade.exit_time;

      const entry = parseTradeDate(entryTime);
      const exit = parseTradeDate(exitTime);

      if (!entry || !exit) return '--';

      const diffMs = exit - entry;
      const diffMins = Math.round(diffMs / 60000);

      if (diffMins < 60) return `${diffMins}m`;
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    } catch {
      return '--';
    }
  };

  // Use imported formatTradeDateTime and formatTradeTime from utils/parseDate

  // Extract strike info - prefer explicit fields, fallback to parsing strategy string
  const shortStrike = trade.short_strike || trade.strategy?.match(/@ ([\d.]+)/)?.[1] || '--';
  const longStrike = trade.long_strike || (shortStrike !== '--' ? (parseFloat(shortStrike) - spreadWidth).toFixed(0) : '--');
  // Cushion: use explicit value if available, calculate if we have entry_spx and short_strike, else '--'
  // Note: trade.cushion could legitimately be 0, so check !== undefined
  const cushion = trade.cushion !== undefined ? trade.cushion
    : (trade.entry_price && shortStrike !== '--' && trade.entry_price > 100)  // entry_price > 100 means it's SPX price, not premium
      ? Math.round(trade.entry_price - parseFloat(shortStrike))
      : '--';
  // FIX: Use trade.bot_name (not trade.bot) - API returns bot_name field
  const strikeDistance = trade.strike_distance || (isSPX ? getStrikeDistanceForBot(trade.bot_name || trade.bot_id) : '--');

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <div>
            <h3 className="text-xl font-bold text-white">
              {isSPX ? 'SPX Put Credit Spread' : trade.symbol || 'Trade'}
            </h3>
            <p className="text-slate-400 text-sm">{trade.bot_name || trade.bot_id || '--'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white text-2xl rounded-full hover:bg-slate-700"
          >
            ×
          </button>
        </div>

        {/* P&L Hero */}
        <div className="p-4 bg-slate-900/50 text-center">
          <div className={`text-3xl font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}${Math.abs(trade.pnl || 0).toFixed(2)}
          </div>
          {trade.pnl_pct !== undefined && (
            <div className={`text-sm ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
              {isPositive ? '+' : ''}{(trade.pnl_pct || 0).toFixed(2)}%
            </div>
          )}
          <div className="text-sm text-slate-500 mt-1">
            {isPositive ? 'Profit' : 'Loss'}{isSPX && ' (Credit Spread)'}
          </div>
        </div>

        {/* Capital Overview */}
        <div className="p-4 space-y-3">
          <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <div className="text-xs text-slate-500 mb-1">Account Capital</div>
                <div className="text-white font-mono font-bold text-lg">${accountCapital.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">% of Capital at Risk</div>
                <div className="text-cyan-400 font-mono font-bold text-lg">{pctOfCapital.toFixed(1)}%</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">Margin Used</div>
                <div className="text-white font-mono">${capitalUsed.toLocaleString()}</div>
                {isSPX && <div className="text-xs text-slate-500">{spreadWidth}pt × {contracts}</div>}
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Max Risk</div>
                <div className="text-white font-mono">${riskAmount.toLocaleString()}</div>
                {isSPX && <div className="text-xs text-slate-500">${maxLossPerContract} × {contracts}</div>}
              </div>
            </div>
          </div>

          {/* Return on Risk & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Return on Risk</div>
              <div className={`font-mono font-bold ${returnOnRisk >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {returnOnRisk >= 0 ? '+' : ''}{returnOnRisk.toFixed(1)}%
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Hold Duration</div>
              <div className="text-white">{calculateDuration()}</div>
            </div>
          </div>

          {/* Entry/Exit Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">{isSPX ? 'Entry SPX' : 'Entry Price'}</div>
              <div className="text-white font-mono">${(trade.entry_price || 0).toFixed(2)}</div>
              <div className="text-xs text-slate-500">{formatTradeTime(trade.entry_time || trade.timestamp)}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">{isSPX ? 'Exit SPX' : 'Exit Price'}</div>
              <div className="text-white font-mono">
                ${(trade.exit_price || 0).toFixed(2)}
                {trade.exit_calculated && <span className="text-yellow-400 ml-1" title="Calculated">⚡</span>}
              </div>
              <div className="text-xs text-slate-500">{formatTradeTime(trade.exit_time)}</div>
            </div>
          </div>

          {/* SPX-specific fields - Spread Structure */}
          {isSPX && (
            <>
              <div className="bg-slate-700/30 rounded-lg p-3 border border-amber-500/30">
                <div className="text-xs text-amber-400 mb-2 font-medium">Spread Structure</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-slate-500">Short Strike</div>
                    <div className="text-white font-mono font-bold text-lg">{shortStrike}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Long Strike</div>
                    <div className="text-white font-mono">{longStrike}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <div className="text-xs text-slate-500">Cushion</div>
                    <div className={`font-mono font-bold ${
                      cushion === '--' ? 'text-slate-400' :
                      cushion >= 50 ? 'text-green-400' :
                      cushion >= 35 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {cushion !== '--' ? `${cushion}pt` : '--'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Strike Distance</div>
                    <div className="text-white">{strikeDistance}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Entry Window & Target */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">{isSPX ? 'Contracts' : 'Quantity'}</div>
              <div className="text-white font-mono font-bold">{contracts}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Entry Window</div>
              <div className="text-white">{trade.entry_window || (isSPX ? '13:00 ET' : '--')}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Target</div>
              <div className="text-white">{trade.target_pct || (isSPX ? '100%' : '--')}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Exit Reason</div>
              <div className="text-white capitalize">{trade.exit_reason || 'EOD'}</div>
            </div>
          </div>

          {/* Equity-specific: Side */}
          {!isSPX && trade.side && (
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Side</div>
              <div className={`font-bold ${trade.side?.toLowerCase() === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                {trade.side?.toUpperCase()}
              </div>
            </div>
          )}

          {/* Strategy - Clickable to view all trades with color coding */}
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">Strategy</div>
            {(trade.strategy || isSPX) ? (
              <button
                onClick={() => {
                  const strat = trade.strategy || 'Put Credit Spread';
                  if (onStrategyClick) onStrategyClick(strat);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white ${getStrategyColor(trade.strategy || 'Put Credit Spread')} hover:opacity-80 transition-opacity`}
              >
                {trade.strategy || 'Put Credit Spread'}
                {onStrategyClick && <span className="text-white/70">→</span>}
              </button>
            ) : (
              <div className="text-slate-400">--</div>
            )}
          </div>

          {/* PPO Context (if available) */}
          {(trade.vix || trade.range_pct || trade.day_of_week) && (
            <div className="bg-slate-700/30 rounded-lg p-3 border border-cyan-500/30">
              <div className="text-xs text-cyan-400 mb-2 font-medium">PPO Context</div>
              <div className="grid grid-cols-3 gap-3">
                {trade.vix && (
                  <div>
                    <div className="text-xs text-slate-500">VIX</div>
                    <div className="text-white font-mono">{trade.vix}</div>
                  </div>
                )}
                {trade.range_pct && (
                  <div>
                    <div className="text-xs text-slate-500">Range %</div>
                    <div className="text-white font-mono">{trade.range_pct}%</div>
                  </div>
                )}
                {trade.day_of_week && (
                  <div>
                    <div className="text-xs text-slate-500">Day</div>
                    <div className="text-white">{trade.day_of_week}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Entry Date */}
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">Entry Date</div>
            <div className="text-white">{formatTradeDateTime(trade.entry_time || trade.timestamp || trade.date)}</div>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-4 border-t border-slate-700 sticky bottom-0 bg-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnifiedDetailCard;
