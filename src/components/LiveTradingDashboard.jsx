import { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';

// Cushion status helper
function getCushionStatus(cushion) {
  if (cushion >= 50) return { label: 'SAFE', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' };
  if (cushion >= 35) return { label: 'CAUTION', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
  return { label: 'DANGER', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
}

// Format time remaining
function formatTimeRemaining(seconds) {
  if (seconds <= 0) return 'Market Closed';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// Format time in Eastern Time
function formatTimeET(dateString) {
  if (!dateString) return '--';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) + ' ET';
}

export function LiveTradingDashboard() {
  const api = useApi();
  const [data, setData] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  // Fetch real-time data
  const fetchRealtime = async () => {
    try {
      const result = await api.fetchApi('/api/spx/realtime');
      setData(result);
      setLastUpdate(new Date());
      setError(null);

      // Add to price history (keep last 100 points)
      if (result.spx?.price) {
        setPriceHistory(prev => {
          const newPoint = {
            time: new Date().toLocaleTimeString(),
            price: result.spx.price,
            timestamp: Date.now()
          };
          const updated = [...prev, newPoint].slice(-100);
          return updated;
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll every 1 second for real-time updates
  useEffect(() => {
    fetchRealtime();
    intervalRef.current = setInterval(fetchRealtime, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  const spx = data?.spx || {};
  const positions = data?.positions || [];
  const sessionPnl = data?.session_pnl || { realized: 0, unrealized: 0, total: 0 };
  const market = data?.market || {};

  // Find the position closest to danger (lowest cushion)
  const sortedPositions = [...positions].sort((a, b) => a.cushion - b.cushion);
  const criticalPosition = sortedPositions[0];
  const minCushion = criticalPosition?.cushion || 0;
  const cushionStatus = getCushionStatus(minCushion);

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          Live Trading Monitor
          <span className={`w-2 h-2 rounded-full ${error ? 'bg-red-400' : 'bg-green-400'} animate-pulse`}></span>
        </h2>
        {lastUpdate && (
          <span className="text-xs text-slate-500">
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* SPX Price */}
        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">SPX Price</div>
          <div className="text-2xl font-mono font-bold text-white">
            {spx.price ? spx.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '--'}
          </div>
          <div className="text-sm text-slate-500">
            {spx.source || 'No data'}
          </div>
        </div>

        {/* Critical Strike */}
        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Nearest Strike</div>
          <div className="text-2xl font-mono font-bold text-white">
            {criticalPosition?.short_strike?.toLocaleString() || '--'}
          </div>
          <div className="text-sm text-slate-500">
            {criticalPosition?.bot?.replace('BOT_', '').replace('_', ' ') || 'No position'}
          </div>
        </div>

        {/* Cushion */}
        <div className={`rounded-xl p-4 border ${cushionStatus.bg} ${cushionStatus.border}`}>
          <div className="text-sm text-slate-400 mb-1">Cushion</div>
          <div className={`text-2xl font-mono font-bold ${cushionStatus.color}`}>
            {positions.length > 0 ? `${minCushion.toFixed(1)}pt` : '--'}
          </div>
          <div className={`text-sm ${cushionStatus.color}`}>
            {positions.length > 0 ? cushionStatus.label : 'No positions'}
          </div>
        </div>

        {/* Time Remaining */}
        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Time Left</div>
          <div className="text-2xl font-mono font-bold text-white">
            {market.time_remaining || '--'}
          </div>
          <div className="text-sm text-slate-500">
            until {market.close_time || '4:00 ET'}
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">SPX Price Chart</h3>
        <SPXChart
          priceHistory={priceHistory}
          positions={positions}
          currentPrice={spx.price}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Open Positions */}
        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            Open Positions
            <span className="text-sm font-normal text-slate-500">({positions.length})</span>
          </h3>
          <PositionsList positions={positions} currentPrice={spx.price} />
        </div>

        {/* Session P&L */}
        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Session P&L</h3>
          <SessionPnL pnl={sessionPnl} />
        </div>
      </div>
    </div>
  );
}

// Simple SVG Chart Component
function SPXChart({ priceHistory, positions, currentPrice }) {
  if (priceHistory.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500">
        Collecting price data...
      </div>
    );
  }

  const width = 800;
  const height = 200;
  const padding = { top: 20, right: 60, bottom: 30, left: 60 };

  const prices = priceHistory.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Add strike levels to range calculation
  const strikes = positions.map(p => p.short_strike).filter(Boolean);
  const allValues = [...prices, ...strikes];
  const rangeMin = Math.min(...allValues) - 5;
  const rangeMax = Math.max(...allValues) + 5;

  const xScale = (i) => padding.left + (i / (priceHistory.length - 1)) * (width - padding.left - padding.right);
  const yScale = (price) => height - padding.bottom - ((price - rangeMin) / (rangeMax - rangeMin)) * (height - padding.top - padding.bottom);

  // Build path
  const pathD = priceHistory.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(p.price)}`).join(' ');

  // Get unique strikes
  const uniqueStrikes = [...new Set(strikes)].sort((a, b) => b - a);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = padding.top + (height - padding.top - padding.bottom) * pct;
        const price = rangeMax - (rangeMax - rangeMin) * pct;
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#334155" strokeWidth="1" />
            <text x={padding.left - 5} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">
              {price.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* Strike lines */}
      {uniqueStrikes.map((strike, i) => {
        const y = yScale(strike);
        if (y < padding.top || y > height - padding.bottom) return null;
        return (
          <g key={`strike-${i}`}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <text x={width - padding.right + 5} y={y + 4} fill="#ef4444" fontSize="10">
              {strike}
            </text>
          </g>
        );
      })}

      {/* Price line */}
      <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2" />

      {/* Current price dot */}
      {priceHistory.length > 0 && (
        <circle
          cx={xScale(priceHistory.length - 1)}
          cy={yScale(priceHistory[priceHistory.length - 1].price)}
          r="4"
          fill="#06b6d4"
        />
      )}

      {/* Current price label */}
      {currentPrice && (
        <text
          x={width - padding.right + 5}
          y={yScale(currentPrice) + 4}
          fill="#06b6d4"
          fontSize="11"
          fontWeight="bold"
        >
          {currentPrice.toFixed(2)}
        </text>
      )}
    </svg>
  );
}

// Positions List Component
function PositionsList({ positions, currentPrice }) {
  if (positions.length === 0) {
    return (
      <div className="text-center text-slate-500 py-6">
        No open SPX positions
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {positions.map((pos, idx) => {
        const cushionStatus = getCushionStatus(pos.cushion);
        return (
          <div
            key={idx}
            className={`p-3 rounded-lg border ${cushionStatus.bg} ${cushionStatus.border}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-white">
                {pos.bot?.replace('BOT_', '')}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${pos.is_shadow ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                {pos.is_shadow ? 'SHADOW' : 'LIVE'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-slate-500 text-xs">Strike</div>
                <div className="font-mono text-white">{pos.short_strike}/{pos.long_strike}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Contracts</div>
                <div className="font-mono text-white">{pos.contracts}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Cushion</div>
                <div className={`font-mono font-bold ${cushionStatus.color}`}>
                  {pos.cushion.toFixed(1)}pt
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-between text-xs">
              <span className="text-slate-500">
                Entry: {pos.entry_spx?.toFixed(2)} @ {formatTimeET(pos.entry_time)}
              </span>
              <span className={pos.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                {pos.unrealized_pnl >= 0 ? '+' : ''}${pos.unrealized_pnl?.toFixed(2)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Session P&L Component
function SessionPnL({ pnl }) {
  const isPositive = pnl.total >= 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Realized</div>
          <div className={`text-xl font-mono font-bold ${pnl.realized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {pnl.realized >= 0 ? '+' : ''}${pnl.realized.toFixed(2)}
          </div>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Unrealized</div>
          <div className={`text-xl font-mono font-bold ${pnl.unrealized >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {pnl.unrealized >= 0 ? '+' : ''}${pnl.unrealized.toFixed(2)}
          </div>
        </div>
      </div>

      <div className={`rounded-lg p-4 text-center ${isPositive ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
        <div className="text-sm text-slate-400 mb-1">Total Session P&L</div>
        <div className={`text-3xl font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}${pnl.total.toFixed(2)}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="bg-slate-700/30 rounded p-2">
          <div className="text-slate-500 text-xs">Trades Today</div>
          <div className="text-white font-mono">--</div>
        </div>
        <div className="bg-slate-700/30 rounded p-2">
          <div className="text-slate-500 text-xs">Win Rate</div>
          <div className="text-white font-mono">--</div>
        </div>
        <div className="bg-slate-700/30 rounded p-2">
          <div className="text-slate-500 text-xs">Max Cushion</div>
          <div className="text-white font-mono">--</div>
        </div>
      </div>
    </div>
  );
}

export default LiveTradingDashboard;
