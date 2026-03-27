import { formatCurrency, formatPercent } from '../../types/v4Types';
import { EmptyState } from './EmptyState';

/**
 * Compact positions table for mobile-first display
 */
export function PositionsTable({ positions = [], title, emptyIcon = '📭', emptyMessage, onPositionClick }) {
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
              <th className="px-3 py-2 font-medium text-right">Entry</th>
              <th className="px-3 py-2 font-medium text-right">Current</th>
              <th className="px-3 py-2 font-medium text-right">P&L</th>
              <th className="px-3 py-2 font-medium text-right hidden sm:table-cell">TP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {positions.map((pos, idx) => {
              const isPositive = pos.unrealizedPnl >= 0;

              return (
                <tr
                  key={`${pos.symbol}-${idx}`}
                  onClick={() => onPositionClick && onPositionClick(pos)}
                  className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-2">
                    <div className="font-mono font-bold text-white">{pos.symbol}</div>
                    <div className="text-xs text-slate-500">{formatCurrency(pos.marketValue, 0)}</div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="font-mono text-slate-300">${pos.entryPrice?.toFixed(2)}</div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className={`font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      ${pos.currentPrice?.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className={`font-mono font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(pos.unrealizedPnlPct)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right hidden sm:table-cell">
                    {pos.takeProfit ? (
                      <div className="font-mono text-cyan-400 text-xs">
                        ${pos.takeProfit.toFixed(2)}
                      </div>
                    ) : (
                      <span className="text-slate-600">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-700/30">
            <tr className="text-xs">
              <td colSpan={3} className="px-3 py-2 text-right text-slate-400">
                Total ({positions.length}):
              </td>
              <td className="px-3 py-2 text-right">
                <span className={`font-mono font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(totalPnl)}
                </span>
              </td>
              <td className="hidden sm:table-cell"></td>
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
export function PositionCards({ positions = [], onPositionClick }) {
  if (!positions || positions.length === 0) return null;

  return (
    <div className="space-y-2">
      {positions.map((pos, idx) => {
        const isPositive = pos.unrealizedPnl >= 0;

        return (
          <div
            key={`${pos.symbol}-${idx}`}
            onClick={() => onPositionClick && onPositionClick(pos)}
            className="bg-slate-800/70 rounded-lg p-3 border border-slate-700/50 cursor-pointer hover:border-cyan-500/30"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-mono font-bold text-white">{pos.symbol}</span>
                <span className="text-xs text-slate-500 ml-2">{formatCurrency(pos.marketValue, 0)}</span>
              </div>
              <span className={`font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(pos.unrealizedPnlPct)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Entry: ${pos.entryPrice?.toFixed(2)}</span>
              <span>Current: ${pos.currentPrice?.toFixed(2)}</span>
              {pos.takeProfit && <span className="text-cyan-400">TP: ${pos.takeProfit.toFixed(2)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
