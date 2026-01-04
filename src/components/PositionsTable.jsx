export function PositionsTable({ positions = [] }) {
  if (!positions || positions.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 text-center">
        <div className="text-slate-400 text-sm">No open positions</div>
      </div>
    );
  }

  const totalPnl = positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
  const isPositive = totalPnl >= 0;

  return (
    <div className="bg-slate-800/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700/50 text-slate-300 text-left">
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Entry</th>
              <th className="px-4 py-3 font-medium text-right">Current</th>
              <th className="px-4 py-3 font-medium text-right">P&L</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Bot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {positions.map((pos, idx) => {
              const pnl = pos.unrealized_pnl || 0;
              const pnlPct = pos.unrealized_pnl_pct || 0;
              const isPosPositive = pnl >= 0;

              return (
                <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{pos.symbol}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        pos.side === 'long'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {pos.side?.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{pos.qty}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-300 hidden sm:table-cell">
                    ${pos.entry_price?.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white">
                    ${pos.current_price?.toFixed(2)}
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
          <tfoot>
            <tr className="bg-slate-700/30 font-medium">
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
