import { useState, useEffect, useRef } from 'react';
import { PositionsTable } from './PositionsTable';
import { BotGrid } from './BotGrid';
import { EventsFeed } from './EventsFeed';
import { CopyButton } from './CopyButton';
import { useApi } from '../hooks/useApi';

export function LiveDesk({ deskData, onBotClick }) {
  const api = useApi();
  const [livePositions, setLivePositions] = useState([]);
  const [totalUnrealized, setTotalUnrealized] = useState(0);
  const [positionsCount, setPositionsCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef(null);

  const bots = deskData?.bots || [];
  const events = deskData?.events || [];
  const dailyPnl = deskData?.daily_pnl || {};
  const summary = deskData?.summary || {};

  const pnl = dailyPnl.daily_pnl || 0;
  const pnlPct = dailyPnl.daily_pnl_pct || 0;
  const isPositive = pnl >= 0;

  // Fetch live positions with prices
  const fetchLivePositions = async () => {
    try {
      setIsLoading(true);
      const data = await api.fetchApi('/api/positions/live');
      if (data && data.positions) {
        setLivePositions(data.positions);
        setTotalUnrealized(data.total_unrealized || 0);
        setPositionsCount(data.count || 0);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch live positions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and set up polling
  useEffect(() => {
    fetchLivePositions();

    // Poll every 10 seconds during market hours
    intervalRef.current = setInterval(fetchLivePositions, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Daily P&L */}
        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Daily P&L</div>
          <div className={`text-2xl font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
          <div className={`text-sm ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
            {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
          </div>
        </div>

        {/* Equity */}
        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Equity</div>
          <div className="text-2xl font-mono font-bold text-white">
            ${(dailyPnl.equity || 0).toLocaleString()}
          </div>
          <div className="text-sm text-slate-500">
            BP: ${(dailyPnl.buying_power || 0).toLocaleString()}
          </div>
        </div>

        {/* Shadow Positions */}
        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Shadow Positions</div>
          <div className="text-2xl font-mono font-bold text-white">
            {positionsCount}
          </div>
          <div className={`text-sm ${totalUnrealized >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
            Unrealized: {totalUnrealized >= 0 ? '+' : ''}${totalUnrealized.toFixed(2)}
          </div>
        </div>

        {/* Bots */}
        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Bots Running</div>
          <div className="text-2xl font-mono font-bold text-green-400">
            {summary.running_bots || 0}
            <span className="text-slate-500 text-lg">/{summary.total_bots || bots.length}</span>
          </div>
          <div className="text-sm text-slate-500">
            Active fleet
          </div>
        </div>
      </div>

      {/* Copy Snapshot Button */}
      <div className="flex items-center gap-4">
        <CopyButton
          label="Copy Snapshot"
          getText={async () => {
            const data = await api.getCopySnapshot();
            return data.text;
          }}
        />
        {lastUpdate && (
          <span className="text-xs text-slate-500">
            Last update: {lastUpdate.toLocaleTimeString()}
            {isLoading && <span className="ml-2 animate-pulse">Updating...</span>}
          </span>
        )}
      </div>

      {/* Live Positions Table */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          Shadow Positions
          <span className="text-xs font-normal text-slate-500">
            ({positionsCount} open)
          </span>
          {isLoading && (
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          )}
        </h3>
        <LivePositionsTable positions={livePositions} />
      </div>

      {/* Two Column Layout for Bots and Events */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <BotGrid bots={bots} onBotClick={onBotClick} />
        </div>
        <div>
          <EventsFeed events={events} />
        </div>
      </div>
    </div>
  );
}

// Live Positions Table with visual indicators
function LivePositionsTable({ positions = [] }) {
  if (!positions || positions.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 text-center">
        <div className="text-slate-400 text-sm">No open shadow positions</div>
      </div>
    );
  }

  // Group by symbol and aggregate
  const grouped = positions.reduce((acc, pos) => {
    const key = `${pos.symbol}_${pos.bot_name}`;
    if (!acc[key]) {
      acc[key] = { ...pos, positions: 1 };
    } else {
      acc[key].qty += pos.qty;
      acc[key].unrealized_pnl += pos.unrealized_pnl || 0;
      acc[key].positions += 1;
    }
    return acc;
  }, {});

  const aggregated = Object.values(grouped).slice(0, 50); // Limit to 50 rows
  const totalPnl = aggregated.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
  const isPositive = totalPnl >= 0;

  return (
    <div className="bg-slate-800/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-700/90 backdrop-blur">
            <tr className="text-slate-300 text-left">
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Entry</th>
              <th className="px-4 py-3 font-medium text-right">Current</th>
              <th className="px-4 py-3 font-medium text-right">P&L</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Bot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {aggregated.map((pos, idx) => {
              const pnl = pos.unrealized_pnl || 0;
              const pnlPct = pos.unrealized_pnl_pct || 0;
              const isPosPositive = pnl >= 0;
              const priceChange = pos.price_change || 'flat';

              return (
                <tr
                  key={idx}
                  className={`hover:bg-slate-700/30 transition-colors ${
                    priceChange === 'up' ? 'animate-pulse-green' :
                    priceChange === 'down' ? 'animate-pulse-red' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{pos.symbol}</span>
                      <span className="bg-green-500/20 text-green-400 text-xs px-1.5 py-0.5 rounded">
                        LONG
                      </span>
                      {pos.positions > 1 && (
                        <span className="text-xs text-slate-500">
                          x{pos.positions}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{pos.qty}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-300 hidden sm:table-cell">
                    ${pos.entry_price?.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <div className="flex items-center justify-end gap-1">
                      {priceChange === 'up' && <span className="text-green-400">▲</span>}
                      {priceChange === 'down' && <span className="text-red-400">▼</span>}
                      <span className={priceChange === 'up' ? 'text-green-400' : priceChange === 'down' ? 'text-red-400' : 'text-white'}>
                        ${pos.current_price?.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className={`font-mono font-medium ${isPosPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPosPositive ? '+' : ''}${pnl.toFixed(2)}
                    </div>
                    <div className={`text-xs ${isPosPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
                      {isPosPositive ? '+' : ''}{pnlPct.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                    {pos.bot_name}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-slate-700/90 backdrop-blur">
            <tr className="font-medium">
              <td colSpan={4} className="px-4 py-3 text-right text-slate-300">
                Total Unrealized:
              </td>
              <td className="px-4 py-3 text-right">
                <span className={`font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}${totalPnl.toFixed(2)}
                </span>
              </td>
              <td className="hidden md:table-cell"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
