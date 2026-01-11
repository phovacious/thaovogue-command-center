import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export function ResearchTab() {
  const api = useApi();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('run_id');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const data = await api.fetchApi('/api/research/runs?limit=200');
      setRuns(data.runs || []);
    } catch (e) {
      console.error('Failed to load runs:', e);
    }
    setLoading(false);
  };

  const filteredRuns = runs.filter(r =>
    !filter ||
    r.strategy_name?.toLowerCase().includes(filter.toLowerCase()) ||
    r.symbol?.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedRuns = [...filteredRuns].sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    return sortDir === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
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
      className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white"
    >
      {children} {sortBy === field && (sortDir === 'desc' ? '▼' : '▲')}
    </th>
  );

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading research runs...
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Research Runs</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Filter by strategy or symbol..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm text-white w-64"
          />
          <button
            onClick={loadRuns}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="text-sm text-slate-400 mb-3">
        {sortedRuns.length} runs found
      </div>

      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <SortHeader field="run_id">Run ID</SortHeader>
                <SortHeader field="strategy_name">Strategy</SortHeader>
                <SortHeader field="symbol">Symbol</SortHeader>
                <SortHeader field="total_trades">Trades</SortHeader>
                <SortHeader field="win_rate">Win Rate</SortHeader>
                <SortHeader field="total_return">P&L</SortHeader>
                <SortHeader field="sharpe_ratio">Sharpe</SortHeader>
                <SortHeader field="max_drawdown">Max DD</SortHeader>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedRuns.map((run, idx) => (
                <tr key={idx} className="hover:bg-slate-700/50">
                  <td className="px-3 py-2 text-sm text-slate-300">#{run.run_id}</td>
                  <td className="px-3 py-2 text-sm font-mono text-cyan-400">{run.strategy_name}</td>
                  <td className="px-3 py-2 text-sm font-bold text-white">{run.symbol}</td>
                  <td className="px-3 py-2 text-sm text-slate-300">{run.total_trades}</td>
                  <td className="px-3 py-2 text-sm">
                    <span className={run.win_rate >= 60 ? 'text-green-400' : run.win_rate >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                      {run.win_rate?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <span className={run.total_return >= 0 ? 'text-green-400' : 'text-red-400'}>
                      ${run.total_return?.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <span className={run.sharpe_ratio >= 1 ? 'text-green-400' : 'text-slate-400'}>
                      {run.sharpe_ratio?.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-red-400">
                    {run.max_drawdown ? `${(run.max_drawdown * 100).toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-3 py-2">
                    {run.verdict === 'TRADE' && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">TRADE</span>
                    )}
                    {run.verdict === 'MARGINAL' && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">MARGINAL</span>
                    )}
                    {run.verdict === 'SKIP' && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">SKIP</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
