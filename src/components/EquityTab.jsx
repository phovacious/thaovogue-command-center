import { useState, useEffect, useMemo } from 'react';
import { useApi } from '../hooks/useApi';

const EQUITY_DESCRIPTIONS = {
  equity_alpha: 'Morning momentum scanner - opening range breakouts',
  equity_beta: 'Momentum continuation - rides winners',
  equity_gamma: 'Mean reversion - oversold bounces',
  spx_canary: 'Conservative SPX options - tests conditions',
  spx_beta: '35pt aggressive SPX credit spreads',
  spx_charlie: '40pt SPX spreads - high conviction',
  ultra_printer: 'TSLA autonomous - dip buying + support',
  bot_spx_recycler: 'Recycles capital through SPX trades',
};

const EQUITY_AGENTS = [
  { key: 'equity_alpha', name: 'Equity Alpha' },
  { key: 'equity_beta', name: 'Equity Beta' },
  { key: 'equity_gamma', name: 'Equity Gamma' },
  // { key: 'spx_canary', name: 'SPX Canary' },
  // { key: 'spx_beta', name: 'SPX Beta' },
  // { key: 'spx_charlie', name: 'SPX Charlie' },
  // { key: 'ultra_printer', name: 'Ultra Printer' },
  // { key: 'bot_spx_recycler', name: 'SPX Recycler' },
];

const DIP_SNIPER_AGENTS = [
  { key: 'dip_sniper_fixed', name: 'Dip Sniper Fixed' },
  { key: 'dip_sniper_universe', name: 'Dip Sniper Universe' },
];

const normalizeKey = (key) => (
  typeof key === 'string'
    ? key.toLowerCase().replace(/[-_]/g, '')
    : ''
);

const getItemKey = (item) => (
  item?.key || item?.agent_key || item?.name || item?.id || ''
);

const normalizeAgents = (agents) => {
  if (Array.isArray(agents)) {
    return agents.map((item) => ({ ...item, key: getItemKey(item) || item?.key }));
  }
  if (agents && typeof agents === 'object') {
    return Object.entries(agents).map(([mapKey, value]) => ({
      ...(value || {}),
      key: getItemKey(value) || mapKey,
    }));
  }
  return [];
};

const findStatusByKey = (list, key) => {
  const agents = normalizeAgents(list);
  if (agents.length === 0) return undefined;
  const needle = normalizeKey(key);
  if (!needle) return undefined;
  return agents.find((item) => normalizeKey(getItemKey(item)) === needle);
};

const isAgentRunning = (status) => {
  if (!status) return false;
  return status.running === true
    || status.running === 'true'
    || status.running === 1
    || status.status === 'RUNNING'
    || status.status === 'running';
};

function AgentCard({ agent, status, onClick }) {
  const running = isAgentRunning(status);
  const statusLabel = status ? (running ? 'RUNNING' : 'STOPPED') : 'UNKNOWN';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-lg border text-left w-full transition-colors cursor-pointer ${
        running ? 'bg-slate-800 border-green-500/30' : 'bg-slate-800/50 border-slate-600'
      } hover:border-cyan-500/60`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-white">{agent.name}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
          running ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/20 text-slate-300'
        }`}>
          {statusLabel}
        </span>
      </div>
      <div className="text-xs text-slate-400">
        {EQUITY_DESCRIPTIONS[agent.key] || 'Agent description pending.'}
      </div>
    </button>
  );
}

function EquityAgentModal({ agent, status, trades, stats, loading, error, onClose }) {
  if (!agent) return null;
  const running = isAgentRunning(status);
  const description = EQUITY_DESCRIPTIONS[agent.key] || 'Agent description pending.';
  const statusLabel = status ? (running ? 'RUNNING' : 'STOPPED') : 'UNKNOWN';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-xl w-full overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{agent.name}</h2>
            <p className="text-sm text-slate-400">{agent.key}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-slate-700/40 rounded p-3 text-sm text-slate-200 border border-slate-600">
            {description}
          </div>
          <div className="bg-slate-700/50 rounded p-3 text-sm">
            <div className="text-xs text-slate-400">Status</div>
            <div className={`font-bold ${running ? 'text-green-400' : 'text-slate-300'}`}>
              {statusLabel}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded p-3 text-sm">
            <div className="text-xs text-slate-400 mb-2">Trade Stats</div>
            {loading ? (
              <div className="text-slate-400 text-xs">Loading trades…</div>
            ) : error ? (
              <div className="text-red-400 text-xs">{error}</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-400">Total Trades</div>
                  <div className="text-white">{stats?.total_trades ?? 0}</div>
                </div>
                <div>
                  <div className="text-slate-400">Win Rate</div>
                  <div className="text-white">{stats?.win_rate ?? 0}%</div>
                </div>
                <div>
                  <div className="text-slate-400">Total P&L</div>
                  <div className="text-white">{stats?.total_pnl ?? 0}</div>
                </div>
                <div>
                  <div className="text-slate-400">Avg Duration</div>
                  <div className="text-white">{stats?.avg_duration ?? 0}m</div>
                </div>
                <div>
                  <div className="text-slate-400">Best Day</div>
                  <div className="text-white">
                    {stats?.best_day ? `${stats.best_day.date} (${stats.best_day.pnl})` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Worst Day</div>
                  <div className="text-white">
                    {stats?.worst_day ? `${stats.worst_day.date} (${stats.worst_day.pnl})` : '—'}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="bg-slate-700/50 rounded p-3 text-sm">
            <div className="text-xs text-slate-400 mb-2">Recent Trades</div>
            {loading ? (
              <div className="text-slate-400 text-xs">Loading trades…</div>
            ) : (trades?.length ?? 0) === 0 ? (
              <div className="text-slate-400 text-xs">No trades logged.</div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-auto">
                {trades.map((trade, idx) => (
                  <div key={idx} className="text-xs text-slate-200 border-b border-slate-600/40 pb-2">
                    <div className="text-slate-400">
                      {trade.symbol} • {trade.entry_time || '—'} → {trade.exit_time || '—'}
                    </div>
                    <div className="flex justify-between">
                      <span>P&L: {trade.pnl ?? 0}</span>
                      <span>{trade.exit_reason || '—'} • {trade.duration_minutes ?? 0}m</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [equityStatus, setEquityStatus] = useState(null);
  const [dipSniperStatus, setDipSniperStatus] = useState(null);
  const [dipSniperError, setDipSniperError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [botTrades, setBotTrades] = useState([]);
  const [botStats, setBotStats] = useState(null);
  const [botTradesLoading, setBotTradesLoading] = useState(false);
  const [botTradesError, setBotTradesError] = useState(null);
  const debugStatus = import.meta.env?.VITE_DEBUG_STATUS === 'true';
  const useMockStatus = import.meta.env?.VITE_USE_MOCK_STATUS === 'true';

  const dipByKey = useMemo(() => {
    const list = Array.isArray(dipSniperStatus?.agents) ? dipSniperStatus.agents : [];
    return Object.fromEntries(list.map((agent) => [agent?.key, agent]));
  }, [dipSniperStatus]);

  const getAgentStatus = (agent) => (
    findStatusByKey(equityStatus?.agents, agent.key)
  );

  useEffect(() => {
    if (debugStatus && dipSniperStatus) {
      console.log('dipSniperStatus set', dipSniperStatus);
    }
  }, [debugStatus, dipSniperStatus]);

  const fetchData = async (signal) => {
    const setIfActive = (setter, value) => {
      if (!signal?.aborted) {
        setter(value);
      }
    };

    try {
      if (useMockStatus) {
        setIfActive(setDipSniperStatus, {
          agents: [{ key: 'dip_sniper_fixed', running: true }],
        });
        setIfActive(setDipSniperError, null);
        setIfActive(setLoading, false);
        return;
      }

      let mmData;
      let statusData;
      try {
        [mmData, statusData] = await Promise.all([
          api.fetchApi('/api/equity/morning-momentum/status', { signal }),
          api.fetchApi('/api/equity/status', { signal }),
        ]);
      } catch (e) {
        console.error('Equity status fetch failed:', e);
      }
      if (mmData?.status === 'ok') {
        setIfActive(setMmStatus, mmData);
      }
      if (statusData) {
        setIfActive(setEquityStatus, {
          ...statusData,
          agents: normalizeAgents(statusData.agents),
        });
      }
      try {
        const dipStatus = await api.fetchApi('/api/dip-sniper/status', { signal });
        console.log('[RAW DIP-SNIPER RESPONSE]', JSON.stringify(dipStatus, null, 2));
        console.log('[RAW] typeof agents:', typeof dipStatus?.agents, 'isArray:', Array.isArray(dipStatus?.agents));
        if (dipStatus) {
          setIfActive(setDipSniperStatus, {
            ...dipStatus,
            agents: normalizeAgents(dipStatus.agents),
          });
          setIfActive(setDipSniperError, null);
        }
      } catch (e) {
        setIfActive(setDipSniperError, e?.message || 'Dip sniper fetch failed');
        console.error('Dip sniper status fetch failed:', e);
      }
    } catch (e) {
      console.error('Failed to fetch morning momentum status:', e);
    }
    if (!signal?.aborted) {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    const interval = setInterval(() => fetchData(controller.signal), 30000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadTrades = async () => {
      if (!selectedAgent) {
        setBotTrades([]);
        setBotStats(null);
        setBotTradesError(null);
        setBotTradesLoading(false);
        return;
      }
      setBotTradesLoading(true);
      setBotTradesError(null);
      try {
        const data = await api.fetchApi(`/api/bot/${selectedAgent.key}/trades?limit=50`);
        if (!active) return;
        setBotTrades(data.trades || []);
        setBotStats(data.stats || null);
      } catch (e) {
        if (!active) return;
        setBotTradesError(e.message || 'Failed to load trades');
      } finally {
        if (active) setBotTradesLoading(false);
      }
    };
    loadTrades();
    return () => {
      active = false;
    };
  }, [api, selectedAgent]);

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
      {debugStatus && (
        <div className="bg-slate-800/70 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300">
          <div className="font-semibold mb-1">Status Debug</div>
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify({
              dipSniperStatus,
              dipSniperError,
              uiKeys: DIP_SNIPER_AGENTS.map((agent) => agent.key),
              apiKeys: Array.isArray(dipSniperStatus?.agents)
                ? dipSniperStatus.agents.map((agent) => agent?.key)
                : [],
              mapped: DIP_SNIPER_AGENTS.map((agent) => ({
                key: agent.key,
                matched: !!dipByKey[agent.key],
                running: dipByKey[agent.key]?.running,
              })),
            }, null, 2)}
          </pre>
        </div>
      )}
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

      {/* Dip Sniper Bots */}
      <section>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span>🎯</span> Dip Sniper Bots
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DIP_SNIPER_AGENTS.map((agent) => (
            <AgentCard
              key={agent.key}
              agent={agent}
              status={Array.isArray(dipSniperStatus?.agents)
                ? dipSniperStatus.agents.find((item) => item?.key === agent.key)
                : undefined}
              onClick={() => setSelectedAgent(agent)}
            />
          ))}
        </div>
      </section>

      {/* Equity Agents */}
      <section>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span>🤖</span> Equity Agents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {EQUITY_AGENTS.filter((agent) => (
            ['equity_alpha', 'equity_beta', 'equity_gamma'].includes(agent.key)
          )).map((agent) => (
            <AgentCard
              key={agent.key}
              agent={agent}
              status={getAgentStatus(agent)}
              onClick={() => setSelectedAgent(agent)}
            />
          ))}
        </div>
      </section>

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

      {selectedAgent && (
        <EquityAgentModal
          agent={selectedAgent}
          status={selectedAgent.key?.startsWith('dip_sniper')
            ? (Array.isArray(dipSniperStatus?.agents)
              ? dipSniperStatus.agents.find((item) => item?.key === selectedAgent.key)
              : undefined)
            : getAgentStatus(selectedAgent)}
          trades={botTrades}
          stats={botStats}
          loading={botTradesLoading}
          error={botTradesError}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}
