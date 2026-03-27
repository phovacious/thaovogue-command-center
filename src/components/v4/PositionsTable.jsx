import { formatCurrency, formatPercent, formatDate } from '../../types/v4Types';
import { EmptyState } from './EmptyState';

/**
 * Mode badge (LIVE/PAPER)
 */
function ModeBadge({ mode, venue }) {
  const isLive = mode === 'live';
  const venueName = venue === 'kraken' ? 'Kraken' : venue === 'schwab' ? 'Schwab' : '';

  return (
    <div className="flex items-center gap-1">
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
        isLive
          ? 'bg-green-500/20 text-green-400'
          : 'bg-blue-500/20 text-blue-400'
      }`}>
        {isLive ? 'LIVE' : 'PAPER'}
      </span>
      {venueName && (
        <span className="text-[9px] text-slate-500">{venueName}</span>
      )}
    </div>
  );
}

/**
 * P&L cell with proper coloring
 */
function PnlCell({ pnlPct, pnlDollar, isStale }) {
  if (isStale) {
    return (
      <div className="text-slate-500 font-mono">
        <div>—</div>
        <div className="text-[10px]">stale</div>
      </div>
    );
  }

  const isPositive = pnlPct > 0;
  const isNegative = pnlPct < 0;
  const colorClass = isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-400';

  return (
    <div className={`font-mono ${colorClass}`}>
      <div className="font-medium">{formatPercent(pnlPct)}</div>
      {pnlDollar !== undefined && (
        <div className="text-[10px] opacity-70">
          {isPositive ? '+' : ''}{formatCurrency(pnlDollar, 0)}
        </div>
      )}
    </div>
  );
}

/**
 * Compact positions table for mobile-first display
 */
export function PositionsTable({ positions = [], title, emptyIcon = '📭', emptyMessage, onPositionClick, showMode = true }) {
  if (!positions || positions.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyMessage || `No ${title || 'positions'} yet`}
      />
    );
  }

  const totalPnl = positions.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0);
  const totalValue = positions.reduce((sum, p) => sum + (p.marketValue || 0), 0);

  return (
    <div className="bg-slate-800/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50">
            <tr className="text-slate-400 text-left text-xs">
              <th className="px-3 py-2 font-medium">Symbol</th>
              {showMode && <th className="px-2 py-2 font-medium">Type</th>}
              <th className="px-2 py-2 font-medium hidden sm:table-cell">Date</th>
              <th className="px-2 py-2 font-medium text-right">Entry</th>
              <th className="px-2 py-2 font-medium text-right">Current</th>
              <th className="px-3 py-2 font-medium text-right">P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {positions.map((pos, idx) => {
              const isStale = pos.isStalePrice;

              return (
                <tr
                  key={`${pos.symbol}-${idx}`}
                  onClick={() => onPositionClick && onPositionClick(pos)}
                  className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  {/* Symbol + Signal */}
                  <td className="px-3 py-2">
                    <div className="font-mono font-bold text-white">{pos.symbol}</div>
                    <div className="text-[10px] text-slate-500">
                      {pos.signalName || formatCurrency(pos.marketValue, 0)}
                    </div>
                  </td>

                  {/* Mode Badge */}
                  {showMode && (
                    <td className="px-2 py-2">
                      <ModeBadge mode={pos.mode} venue={pos.venue} />
                    </td>
                  )}

                  {/* Date */}
                  <td className="px-2 py-2 hidden sm:table-cell">
                    <div className="text-xs text-slate-400">{formatDate(pos.entryTime)}</div>
                  </td>

                  {/* Entry Price */}
                  <td className="px-2 py-2 text-right">
                    <div className="font-mono text-slate-300">${pos.entryPrice?.toFixed(2)}</div>
                  </td>

                  {/* Current Price */}
                  <td className="px-2 py-2 text-right">
                    {isStale ? (
                      <div className="font-mono text-slate-500">—</div>
                    ) : (
                      <div className={`font-mono ${
                        pos.currentPrice > pos.entryPrice ? 'text-green-400' :
                        pos.currentPrice < pos.entryPrice ? 'text-red-400' : 'text-slate-300'
                      }`}>
                        ${pos.currentPrice?.toFixed(2)}
                      </div>
                    )}
                  </td>

                  {/* P&L */}
                  <td className="px-3 py-2 text-right">
                    <PnlCell
                      pnlPct={pos.unrealizedPnlPct}
                      pnlDollar={pos.unrealizedPnl}
                      isStale={isStale}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-700/30">
            <tr className="text-xs">
              <td colSpan={showMode ? 5 : 4} className="px-3 py-2 text-right text-slate-400">
                Total ({positions.length}):
              </td>
              <td className="px-3 py-2 text-right">
                <span className={`font-mono font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(totalPnl)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/**
 * Position cards for very small screens
 */
export function PositionCards({ positions = [], onPositionClick, showMode = true }) {
  if (!positions || positions.length === 0) return null;

  return (
    <div className="space-y-2">
      {positions.map((pos, idx) => {
        const isStale = pos.isStalePrice;
        const isPositive = pos.unrealizedPnl > 0;
        const isNegative = pos.unrealizedPnl < 0;

        return (
          <div
            key={`${pos.symbol}-${idx}`}
            onClick={() => onPositionClick && onPositionClick(pos)}
            className="bg-slate-800/70 rounded-lg p-3 border border-slate-700/50 cursor-pointer hover:border-cyan-500/30"
          >
            {/* Top row: Symbol + Mode + P&L */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white">{pos.symbol}</span>
                {showMode && <ModeBadge mode={pos.mode} venue={pos.venue} />}
              </div>
              {isStale ? (
                <span className="font-mono text-slate-500">—</span>
              ) : (
                <span className={`font-mono font-bold ${
                  isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {formatPercent(pos.unrealizedPnlPct)}
                </span>
              )}
            </div>

            {/* Bottom row: Details */}
            <div className="flex justify-between text-xs text-slate-400">
              <span>Entry: ${pos.entryPrice?.toFixed(2)}</span>
              {isStale ? (
                <span className="text-slate-500">Current: —</span>
              ) : (
                <span>Current: ${pos.currentPrice?.toFixed(2)}</span>
              )}
              <span>{formatDate(pos.entryTime)}</span>
            </div>

            {/* Signal name if present */}
            {pos.signalName && (
              <div className="mt-1 text-[10px] text-cyan-400/70">
                Signal: {pos.signalName}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
