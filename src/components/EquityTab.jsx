import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

function MorningMomentumCard({ data, onScan }) {
  const [scanning, setScanning] = useState(false);

  const handleScan = async (type) => {
    setScanning(true);
    await onScan(type);
    setScanning(false);
  };

  if (!data) return null;

  const pnlColor = data.daily_pnl >= 0 ? 'text-green-400' : 'text-red-400';
  const modeColor = data.mode === 'PAPER' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400';
  const universeColor = data.universe_mode === 'DYNAMIC' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-400';

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌅</span>
          <h3 className="font-bold text-white">Morning Momentum v2</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${modeColor}`}>
            {data.mode}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${universeColor}`}>
            {data.universe_mode || 'STATIC'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleScan('premarket')}
            disabled={scanning}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {scanning ? '...' : 'Scan'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <span className="text-slate-400 text-xs">Daily P&L</span>
            <div className={`font-mono text-lg font-bold ${pnlColor}`}>
              ${data.daily_pnl?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div>
            <span className="text-slate-400 text-xs">Trades</span>
            <div className="font-mono text-white">
              {data.daily_trades || 0}/{data.max_daily_trades || 3}
            </div>
          </div>
          <div>
            <span className="text-slate-400 text-xs">Position Size</span>
            <div className="font-mono text-cyan-400">
              ${data.parameters?.base_position_size || 500}
            </div>
          </div>
          <div>
            <span className="text-slate-400 text-xs">Target/Stop</span>
            <div className="font-mono text-white">
              +{data.parameters?.target_pct || 2}% / -{data.parameters?.stop_pct || 1.5}%
            </div>
          </div>
        </div>

        {/* Open Positions */}
        {data.open_positions?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-400 mb-2">Open Positions</h4>
            <div className="space-y-2">
              {data.open_positions.map((p, i) => (
                <div key={i} className="bg-slate-700/50 rounded p-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white">{p.ticker}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      {p.shares} shares @ ${p.entry_price}
                    </span>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-slate-400">Stop: ${p.stop_price}</div>
                    <div className="text-green-400">Target: ${p.target_price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Candidates */}
        {data.candidates?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-400 mb-2">
              Top Candidates
              <span className="text-xs text-slate-500 ml-2">
                ({data.candidates[0]?.source === 'DYNAMIC' ? 'from 500+ stocks' : 'from static list'})
              </span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.candidates.slice(0, 4).map((c, i) => (
                <div key={i} className="bg-slate-700/50 rounded p-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white">{c.ticker}</span>
                    {(c.weighted_score || c.score) && (
                      <span className="text-xs text-cyan-400 ml-2">Score: {c.weighted_score || c.score}</span>
                    )}
                    {c.sector && (
                      <span className="text-xs text-purple-400 ml-2">{c.sector}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    {c.gap_pct ? `${c.gap_pct > 0 ? '+' : ''}${c.gap_pct}%` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sector Breakdown */}
        {data.sector_breakdown && Object.keys(data.sector_breakdown).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-400 mb-2">Sector Distribution</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.sector_breakdown).map(([sector, count]) => (
                <span key={sector} className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">
                  {sector}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Closed Trades Today */}
        {data.closed_trades?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2">Today's Trades</h4>
            <div className="space-y-1">
              {data.closed_trades.map((t, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium text-white">{t.ticker}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      ${t.entry_price} → ${t.exit_price}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      t.exit_reason === 'TARGET' ? 'bg-green-500/20 text-green-400' :
                      t.exit_reason === 'STOP' ? 'bg-red-500/20 text-red-400' :
                      'bg-slate-600 text-slate-300'
                    }`}>
                      {t.exit_reason}
                    </span>
                    <span className={`font-mono ${t.pnl_dollar >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${t.pnl_dollar > 0 ? '+' : ''}{t.pnl_dollar?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!data.open_positions?.length && !data.candidates?.length && !data.closed_trades?.length && (
          <div className="text-center text-slate-400 py-4">
            <div className="text-2xl mb-2">⏰</div>
            <div className="text-sm">Waiting for market open (9:30 AM ET)</div>
            <div className="text-xs mt-1">Pre-market scan starts at 9:00 AM</div>
          </div>
        )}
      </div>

      {/* Universe */}
      <div className="px-4 py-3 border-t border-slate-700 bg-slate-700/30">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {['AMD', 'COIN', 'MSTR', 'NVDA'].map(t => (
              <span key={t} className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                {t}
              </span>
            ))}
            <span className="text-xs text-slate-500">validated tickers</span>
          </div>
          <div className="text-xs text-slate-400">
            {data.universe_mode === 'DYNAMIC' ? (
              <span className="text-purple-400">Scanning 500+ stocks</span>
            ) : (
              <span>Static universe: 30 tickers</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StrategyParamsCard({ params }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="font-bold text-white mb-3 flex items-center gap-2">
        <span>⚙️</span> Strategy Parameters
      </h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-400">Entry</span>
          <div className="text-white">Break above 5m high + 0.1%</div>
        </div>
        <div>
          <span className="text-slate-400">Target</span>
          <div className="text-green-400">+{params?.target_pct || 2.0}%</div>
        </div>
        <div>
          <span className="text-slate-400">Stop</span>
          <div className="text-red-400">-{params?.stop_pct || 1.5}%</div>
        </div>
        <div>
          <span className="text-slate-400">Time Exit</span>
          <div className="text-white">10:00 AM ET</div>
        </div>
        <div>
          <span className="text-slate-400">Signal Requirements</span>
          <div className="text-white">Vol ≥{params?.signal_vol_ratio || 1.5}x, Range ≥{params?.signal_range_pct || 0.5}%</div>
        </div>
        <div>
          <span className="text-slate-400">Max Daily Trades</span>
          <div className="text-white">3</div>
        </div>
      </div>
    </div>
  );
}

function BacktestResultsCard() {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="font-bold text-white mb-3 flex items-center gap-2">
        <span>📊</span> 60-Day Backtest Results
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-slate-400">Trades</span>
          <div className="text-white font-mono">20</div>
        </div>
        <div>
          <span className="text-slate-400">Win Rate</span>
          <div className="text-green-400 font-mono">65%</div>
        </div>
        <div>
          <span className="text-slate-400">Profit Factor</span>
          <div className="text-cyan-400 font-mono">2.43</div>
        </div>
        <div>
          <span className="text-slate-400">Total P&L</span>
          <div className="text-green-400 font-mono">+$29.20</div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
        Validated on: AMD (PF 6.54), COIN (PF 2.23), MSTR (PF 1.50), NVDA (100% WR)
      </div>
    </div>
  );
}

export function EquityTab() {
  const api = useApi();
  const [mmStatus, setMmStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await api.fetchApi('/api/equity/morning-momentum/status');
      if (data.status === 'ok') {
        setMmStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch morning momentum status:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = async (type) => {
    try {
      await api.fetchApi(`/api/equity/morning-momentum/scan?scan_type=${type}`, { method: 'POST' });
      await fetchData();
    } catch (e) {
      console.error('Scan failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-slate-400">Loading equity swarm...</p>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>📈</span> Equity Swarm
        </h1>
        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
          Morning Momentum Active
        </span>
      </div>

      {/* Morning Momentum Card */}
      <MorningMomentumCard data={mmStatus} onScan={handleScan} />

      {/* Grid: Strategy Params + Backtest Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StrategyParamsCard params={mmStatus?.parameters} />
        <BacktestResultsCard />
      </div>

      {/* Schedule */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <span>🕐</span> Daily Schedule (ET)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="text-center p-2 bg-slate-700/50 rounded">
            <div className="text-slate-400 text-xs">Pre-market Scan</div>
            <div className="text-white">9:00, 9:15, 9:25</div>
          </div>
          <div className="text-center p-2 bg-slate-700/50 rounded">
            <div className="text-slate-400 text-xs">Final Scan</div>
            <div className="text-white">9:35</div>
          </div>
          <div className="text-center p-2 bg-slate-700/50 rounded">
            <div className="text-slate-400 text-xs">Execute</div>
            <div className="text-white">9:36</div>
          </div>
          <div className="text-center p-2 bg-slate-700/50 rounded">
            <div className="text-slate-400 text-xs">Monitor</div>
            <div className="text-white">9:40-9:55</div>
          </div>
          <div className="text-center p-2 bg-slate-700/50 rounded">
            <div className="text-slate-400 text-xs">Force Exit</div>
            <div className="text-white">10:00</div>
          </div>
        </div>
      </div>
    </div>
  );
}
