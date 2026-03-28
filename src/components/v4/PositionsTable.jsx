import { formatCurrency, formatPercent } from '../../types/v4Types';
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
 * Quote status indicator with improved stale display
 * < 15 min: no label
 * 15-59 min: "22m old" (yellow)
 * 1-9h: "2.4h old" (yellow)
 * >= 10h: "Stale · 11.1h" (orange/red)
 */
function QuoteStatusBadge({ status, reason }) {
  if (status === 'fresh') return null;

  const text = status === 'missing' ? 'No quote' : (reason || '⚠ stale');

  // Color based on staleness severity
  let color = 'text-slate-500';
  if (status === 'stale' && reason) {
    if (reason.includes('Stale ·')) {
      // >= 10h - orange/red
      color = 'text-orange-400';
    } else {
      // 15min - 9h - yellow
      color = 'text-yellow-400/80';
    }
  }

  return (
    <span className={`text-[10px] ${color} whitespace-nowrap`}>
      {text}
    </span>
  );
}

/**
 * P&L cell with proper coloring
 */
function PnlCell({ pnlPct, pnlDollar, quoteStatus, staleReason }) {
  const hasPnl = pnlPct !== null && pnlPct !== undefined;
  const isPositive = hasPnl && pnlPct > 0;
  const isNegative = hasPnl && pnlPct < 0;
  const colorClass = !hasPnl ? 'text-slate-500' : isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-400';

  return (
    <div className={`font-mono ${colorClass}`}>
      <div className="font-medium">{hasPnl ? `PNLFIELD ${formatPercent(pnlPct)}` : 'PNLFIELD —'}</div>
      <div className="text-[10px] opacity-80">
        {pnlDollar !== null && pnlDollar !== undefined ? `${pnlDollar > 0 ? '+' : ''}${formatCurrency(pnlDollar, 0)}` : '—'}
      </div>
      <QuoteStatusBadge status={quoteStatus} reason={staleReason} />
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

  const sortedPositions = [...positions].sort(
    (a, b) => Math.abs(b.pnlDollar ?? 0) - Math.abs(a.pnlDollar ?? 0)
  );
  const totalPnl = sortedPositions.reduce((sum, p) => sum + (p.pnlDollar || 0), 0);

  return (
    <div className="bg-slate-800/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-700/50">
            <tr className="text-slate-400 text-left text-xs">
              <th className="px-3 py-2.5 font-medium">Position</th>
              {showMode && <th className="px-2 py-2.5 font-medium">Type</th>}
              <th className="px-3 py-2.5 font-medium text-right">Live</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {sortedPositions.map((pos, idx) => {
              const quoteStatus = pos.quoteStatus || (pos.hasLivePrice ? 'fresh' : 'missing');
              const currentColor =
                pos.pnlPercent == null
                  ? 'text-slate-500'
                  : pos.pnlPercent > 0
                    ? 'text-green-400'
                    : pos.pnlPercent < 0
                      ? 'text-red-400'
                      : 'text-slate-300';

              return (
                <tr
                  key={`${pos.symbol}-${idx}`}
                  onClick={() => onPositionClick && onPositionClick(pos)}
                  className="hover:bg-slate-700/30 transition-colors cursor-pointer active:bg-slate-700/50"
                >
                  {/* Symbol + Signal */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{pos.symbol}</span>
                      {/* Tap indicator on mobile */}
                      <svg className="w-3 h-3 text-slate-500 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {pos.strategy || pos.refLabel || pos.signalName || pos.tier || '—'}
                    </div>
                    {pos.refLabel && pos.refLabel !== pos.strategy && (
                      <div className="text-[10px] text-slate-600 mt-0.5">
                        {pos.refLabel}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-600 mt-1">
                      Entry {pos.entryPrice != null ? `$${pos.entryPrice.toFixed(2)}` : '—'}
                    </div>
                  </td>

                  {/* Mode Badge */}
                  {showMode && (
                    <td className="px-2 py-3">
                      <ModeBadge mode={pos.mode} venue={pos.venue} />
                    </td>
                  )}

                  <td className="px-3 py-3 text-right">
                    <div className={`font-mono font-medium ${currentColor}`}>
                      {pos.currentPrice != null ? `LIVEFIELD $${pos.currentPrice.toFixed(2)}` : 'LIVEFIELD —'}
                    </div>
                    <PnlCell
                      pnlPct={pos.pnlPercent}
                      pnlDollar={pos.pnlDollar}
                      quoteStatus={quoteStatus}
                      staleReason={pos.staleReason}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-700/30">
            <tr className="text-xs">
              <td colSpan={showMode ? 2 : 1} className="px-3 py-2 text-right text-slate-400">
                Total ({sortedPositions.length}):
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
  const sortedPositions = [...positions].sort(
    (a, b) => Math.abs(b.pnlDollar ?? 0) - Math.abs(a.pnlDollar ?? 0)
  );

  return (
    <div className="space-y-2">
      {sortedPositions.map((pos, idx) => {
        const quoteStatus = pos.quoteStatus || (pos.hasLivePrice ? 'fresh' : 'missing');
        const hasPriceData = pos.currentPrice != null;
        const isPositive = (pos.pnlPercent ?? 0) > 0;
        const isNegative = (pos.pnlPercent ?? 0) < 0;

        return (
          <div
            key={`${pos.symbol}-${idx}`}
            onClick={() => onPositionClick && onPositionClick(pos)}
            className="bg-slate-800/70 rounded-lg p-3 border border-slate-700/50 cursor-pointer hover:border-cyan-500/30 active:bg-slate-700/50"
          >
            {/* Top row: Symbol + Mode + P&L */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white">{pos.symbol}</span>
                {showMode && <ModeBadge mode={pos.mode} venue={pos.venue} />}
              </div>
              {!hasPriceData ? (
                <div className="flex flex-col items-end">
                  <span className="font-mono text-slate-500">—</span>
                  <QuoteStatusBadge status={quoteStatus} reason={pos.staleReason} />
                </div>
              ) : (
                <div className="text-right">
                  <div className={`font-mono font-bold ${
                  quoteStatus === 'stale' ? 'opacity-70' : ''
                } ${
                  isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-400'
                }`}>
                    {`LIVEFIELD $${pos.currentPrice?.toFixed(2)}`}
                  </div>
                  <div className={`font-mono text-xs ${
                    isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-500'
                  }`}>
                    {pos.pnlPercent != null ? `PNLFIELD ${formatPercent(pos.pnlPercent)}` : 'PNLFIELD —'}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom row: Details */}
            <div className="flex justify-between text-xs text-slate-400">
              <span>{pos.strategy || pos.refLabel || pos.signalName || '—'}</span>
              {!hasPriceData ? (
                <span className="text-slate-500">Current: —</span>
              ) : (
                <span>{pos.pnlDollar != null ? `${pos.pnlDollar > 0 ? '+' : ''}${formatCurrency(pos.pnlDollar, 0)}` : '—'}</span>
              )}
              <span>{pos.dateShort || '--'}</span>
            </div>

            {/* Signal name if present */}
            {(pos.refLabel || pos.signalName || pos.tier) && (
              <div className="mt-1 flex items-center gap-2">
                {pos.tier && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                    {pos.tier}
                  </span>
                )}
                {(pos.refLabel || pos.signalName) && (pos.refLabel || pos.signalName) !== pos.tier && (
                  <span className="text-[10px] text-purple-400/70">
                    {pos.refLabel || pos.signalName}
                  </span>
                )}
                <QuoteStatusBadge status={quoteStatus} reason={pos.staleReason} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
