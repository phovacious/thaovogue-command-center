import React, { useState, useMemo } from 'react';

const StrategyDetailModal = ({ strategy, trades, onClose, onTradeClick }) => {
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterSymbol, setFilterSymbol] = useState('all');

  // Filter trades for this strategy
  const strategyTrades = useMemo(() => {
    return trades.filter(t => t.strategy === strategy);
  }, [trades, strategy]);

  // Get unique symbols
  const symbols = useMemo(() => {
    const syms = [...new Set(strategyTrades.map(t => t.symbol || t.ticker))];
    return ['all', ...syms.sort()];
  }, [strategyTrades]);

  // Filter and sort
  const displayTrades = useMemo(() => {
    let filtered = filterSymbol === 'all'
      ? strategyTrades
      : strategyTrades.filter(t => (t.symbol || t.ticker) === filterSymbol);

    return filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'date') {
        aVal = new Date(a.entry_time || a.timestamp);
        bVal = new Date(b.entry_time || b.timestamp);
      } else if (sortBy === 'pnl') {
        aVal = a.pnl || 0;
        bVal = b.pnl || 0;
      } else if (sortBy === 'symbol') {
        aVal = a.symbol || a.ticker || '';
        bVal = b.symbol || b.ticker || '';
      }
      return sortOrder === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
    });
  }, [strategyTrades, filterSymbol, sortBy, sortOrder]);

  // Calculate stats
  const stats = useMemo(() => {
    const wins = displayTrades.filter(t => (t.pnl || 0) > 0).length;
    const losses = displayTrades.filter(t => (t.pnl || 0) <= 0).length;
    const totalPnl = displayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const avgPnl = displayTrades.length > 0 ? totalPnl / displayTrades.length : 0;
    const winRate = displayTrades.length > 0 ? (wins / displayTrades.length * 100) : 0;

    // By symbol breakdown
    const bySymbol = {};
    displayTrades.forEach(t => {
      const sym = t.symbol || t.ticker || 'UNKNOWN';
      if (!bySymbol[sym]) {
        bySymbol[sym] = { trades: 0, wins: 0, pnl: 0 };
      }
      bySymbol[sym].trades++;
      bySymbol[sym].pnl += (t.pnl || 0);
      if ((t.pnl || 0) > 0) bySymbol[sym].wins++;
    });

    return { wins, losses, totalPnl, avgPnl, winRate, bySymbol };
  }, [displayTrades]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';

    // Handle "2026-01-06 15:55:29 ET" format - remove timezone suffix
    let cleanStr = dateStr.replace(/\s*(ET|EST|EDT|UTC)$/i, '').trim();

    // Try parsing the cleaned string
    let d = new Date(cleanStr);

    // If still invalid, try ISO format conversion
    if (isNaN(d.getTime())) {
      // Try "YYYY-MM-DD HH:MM:SS" format
      const match = cleanStr.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/);
      if (match) {
        d = new Date(`${match[1]}T${match[2]}`);
      }
    }

    if (isNaN(d.getTime())) return dateStr; // Return original if all parsing fails

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatPnl = (pnl) => {
    if (pnl === null || pnl === undefined) return '--';
    const formatted = Math.abs(pnl).toFixed(2);
    return pnl >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header - Fixed */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">{strategy}</h2>
            <p className="text-gray-400 text-sm">{strategyTrades.length} total trades</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Stats Summary */}
          <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3 border-b border-gray-700">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className={`text-xl font-bold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPnl(stats.totalPnl)}
            </div>
            <div className="text-gray-400 text-xs">Total P&L</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">{stats.winRate.toFixed(1)}%</div>
            <div className="text-gray-400 text-xs">Win Rate</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-400">{stats.wins}</div>
            <div className="text-gray-400 text-xs">Wins</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-red-400">{stats.losses}</div>
            <div className="text-gray-400 text-xs">Losses</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className={`text-xl font-bold ${stats.avgPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPnl(stats.avgPnl)}
            </div>
            <div className="text-gray-400 text-xs">Avg P&L</div>
          </div>
        </div>

        {/* Symbol Breakdown */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">By Symbol</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.bySymbol)
              .sort((a, b) => b[1].pnl - a[1].pnl)
              .map(([sym, data]) => (
                <button
                  key={sym}
                  onClick={() => setFilterSymbol(filterSymbol === sym ? 'all' : sym)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterSymbol === sym
                      ? 'bg-blue-600 text-white'
                      : data.pnl >= 0
                        ? 'bg-green-900/50 text-green-400 hover:bg-green-900'
                        : 'bg-red-900/50 text-red-400 hover:bg-red-900'
                  }`}
                >
                  {sym}: {formatPnl(data.pnl)} ({data.wins}/{data.trades})
                </button>
              ))}
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 flex gap-4 items-center border-b border-gray-700">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 text-white rounded px-3 py-1 text-sm"
          >
            <option value="date">Sort by Date</option>
            <option value="pnl">Sort by P&L</option>
            <option value="symbol">Sort by Symbol</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="bg-gray-800 text-white rounded px-3 py-1 text-sm"
          >
            {sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </button>
          {filterSymbol !== 'all' && (
            <button
              onClick={() => setFilterSymbol('all')}
              className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
            >
              Clear Filter
            </button>
          )}
        </div>

          {/* Trade List */}
          <div className="p-4">
            <table className="w-full">
              <thead className="text-gray-400 text-xs sticky top-0 bg-gray-900">
                <tr>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-right py-2">Entry</th>
                  <th className="text-right py-2">Exit</th>
                  <th className="text-right py-2">P&L</th>
                  <th className="text-left py-2">Exit Reason</th>
                </tr>
              </thead>
              <tbody>
                {displayTrades.map((trade, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onTradeClick && onTradeClick(trade)}
                    className="border-t border-gray-800 hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <td className="py-2 text-gray-300 text-sm">{formatDate(trade.entry_time || trade.timestamp)}</td>
                    <td className="py-2 text-white font-medium">{trade.symbol || trade.ticker}</td>
                    <td className="py-2 text-gray-300 text-right">${trade.entry_price?.toFixed(2) || '--'}</td>
                    <td className="py-2 text-gray-300 text-right">${trade.exit_price?.toFixed(2) || '--'}</td>
                    <td className={`py-2 text-right font-medium ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPnl(trade.pnl)}
                    </td>
                    <td className="py-2 text-gray-400 text-sm">{trade.exit_reason || trade.reason || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayTrades.length === 0 && (
              <div className="text-center text-gray-500 py-8">No trades found</div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyDetailModal;
