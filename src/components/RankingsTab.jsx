import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export function RankingsTab() {
  const api = useApi();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('total_pnl');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    setLoading(true);
    try {
      const data = await api.fetchApi('/api/research/rankings');
      setRankings(data.rankings || []);
    } catch (e) {
      console.error('Failed to load rankings:', e);
    }
    setLoading(false);
  };

  const sortedRankings = [...rankings].sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const SortHeader = ({ field, children }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white"
    >
      {children} {sortBy === field && (sortDir === 'desc' ? '▼' : '▲')}
    </th>
  );

  // Calculate totals
  const totals = {
    tests: rankings.reduce((s, r) => s + (r.total_tests || 0), 0),
    trades: rankings.reduce((s, r) => s + (r.total_trades || 0), 0),
    pnl: rankings.reduce((s, r) => s + (r.total_pnl || 0), 0),
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading rankings...
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Symbol Rankings</h2>
        <button
          onClick={loadRankings}
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-500 text-sm">Total Symbols Tested</div>
          <div className="text-2xl font-bold text-white">{rankings.length}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-500 text-sm">Total Backtest Runs</div>
          <div className="text-2xl font-bold text-white">{totals.tests.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-500 text-sm">Total Simulated P&L</div>
          <div className={`text-2xl font-bold ${totals.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${totals.pnl.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Rank</th>
                <SortHeader field="symbol">Symbol</SortHeader>
                <SortHeader field="total_tests">Tests</SortHeader>
                <SortHeader field="total_trades">Trades</SortHeader>
                <SortHeader field="avg_win_rate">Avg Win Rate</SortHeader>
                <SortHeader field="total_pnl">Total P&L</SortHeader>
                <SortHeader field="avg_sharpe">Avg Sharpe</SortHeader>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedRankings.map((r, idx) => {
                // Calculate grade
                let grade = 'C';
                let gradeColor = 'text-slate-400';
                if (r.total_pnl > 5000 && r.avg_win_rate > 60 && r.avg_sharpe > 1) {
                  grade = 'A';
                  gradeColor = 'text-green-400';
                } else if (r.total_pnl > 1000 && r.avg_win_rate > 55) {
                  grade = 'B';
                  gradeColor = 'text-cyan-400';
                } else if (r.total_pnl < 0) {
                  grade = 'D';
                  gradeColor = 'text-red-400';
                }

                return (
                  <tr key={r.symbol} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <span className={`text-lg font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-lg font-bold text-white">{r.symbol}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{r.total_tests}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{r.total_trades?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${r.avg_win_rate >= 60 ? 'bg-green-500' : r.avg_win_rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(r.avg_win_rate || 0, 100)}%` }}
                          />
                        </div>
                        <span className={r.avg_win_rate >= 60 ? 'text-green-400' : r.avg_win_rate >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                          {r.avg_win_rate?.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${r.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${r.total_pnl?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={r.avg_sharpe >= 1 ? 'text-green-400' : 'text-slate-400'}>
                        {r.avg_sharpe?.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xl font-bold ${gradeColor}`}>{grade}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
