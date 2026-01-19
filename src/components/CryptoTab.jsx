import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const AGENT_DESCRIPTIONS = {
  // Crypto
  coordinator: 'Orchestrates all crypto agents, manages state and prevents conflicts',
  scanner: 'Scans for volume spikes and momentum signals across all tokens',
  risk: 'Monitors position sizes, drawdowns, and enforces risk limits',
  agent_v2: 'Executes two-stage accumulation strategy (spike → breakout)',
  dip_buyer: 'Buys dips on high-conviction tokens when RSI oversold',
  // Equity
  equity_alpha: 'Morning momentum scanner - finds opening range breakouts',
  spx_canary: 'Conservative SPX options - tests market conditions first',
  ultra_printer: 'TSLA autonomous agent - dip buying and support bounces',
};

// Agent Status Badge
function AgentStatus({ name, running, cpu, mem, pid, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-lg border text-left w-full transition-colors cursor-pointer ${
        running ? 'bg-slate-800 border-green-500/30' : 'bg-slate-800/50 border-red-500/30'
      } hover:border-cyan-500/60`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-white">{name}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${running ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {running ? 'RUNNING' : 'STOPPED'}
        </span>
      </div>
      {running && (
        <div className="flex gap-4 text-xs text-slate-400">
          <span>PID: {pid}</span>
          <span>CPU: {cpu}%</span>
          <span>MEM: {mem}%</span>
        </div>
      )}
    </button>
  );
}

// Event Card
function EventCard({ event }) {
  const isSignal = event.signals_found > 0;
  const isDip = event.type === 'dip_scan';
  const isHeartbeat = event.type === 'heartbeat';

  return (
    <div className={`p-3 rounded-lg border ${
      isSignal
        ? 'bg-green-500/10 border-green-500/30'
        : isHeartbeat
          ? 'bg-slate-800/50 border-slate-700/50'
          : 'bg-slate-800 border-slate-700'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{isHeartbeat ? '💓' : isDip ? '📉' : '📊'}</span>
          <span className="text-sm font-medium text-white">
            {isHeartbeat ? `${event.agent || 'Agent'} Heartbeat` : isDip ? 'Dip Scan' : 'Momentum Scan'}
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {new Date(event.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {isHeartbeat ? (
        <div className="text-xs text-slate-400">
          {event.message || 'Heartbeat OK'}
        </div>
      ) : isSignal ? (
        <div className="bg-green-500/20 rounded p-2 mb-2">
          <span className="text-green-400 font-bold">🚀 {event.signals_found} SIGNAL(S) FOUND!</span>
          {event.signals?.map((sig, i) => (
            <div key={i} className="text-sm text-green-300 mt-1">
              {sig.symbol}: {sig.reason}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-400">
          Scanned {event.symbols_scanned} pairs • No signals
        </div>
      )}

      {/* Top rejections */}
      {event.rejected?.slice(0, 3).map((r, i) => (
        <div key={i} className="text-xs text-slate-500 mt-1">
          {r.symbol}: {r.reason}
        </div>
      ))}
    </div>
  );
}

// Trade Card
function TradeCard({ trade }) {
  const pnl = trade.pnl ?? 0;
  const isWin = trade.win || pnl > 0;
  const size = trade.size ?? trade.size_usd ?? 0;
  const pnlPct = trade.pnl_pct ?? 0;
  const action = trade.action || trade.side || '';

  return (
    <div className={`p-3 rounded-lg border ${isWin ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-mono font-bold text-white">{trade.pair || trade.symbol}</span>
          {action && (
            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${action === 'LONG' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-orange-500/20 text-orange-400'}`}>
              {action}
            </span>
          )}
          <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${isWin ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {isWin ? 'WIN' : 'LOSS'}
          </span>
        </div>
        <span className={`font-mono font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
        <div>Entry: ${trade.entry_price?.toFixed(4)}</div>
        <div>Exit: ${trade.exit_price?.toFixed(4)}</div>
        <div>Size: ${size.toFixed(2)}</div>
        <div>P&L: {(pnlPct * 100).toFixed(2)}%</div>
      </div>
      <div className="text-xs text-slate-500 mt-2">
        {trade.exit_reason} • {trade.exit_time ? new Date(trade.exit_time).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
}

// P&L Summary Card
function PnLCard({ pnl }) {
  const totalPnl = pnl?.total_pnl || 0;
  const isPositive = totalPnl >= 0;

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="text-lg font-bold text-white mb-3">💰 Crypto P&L</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-slate-400">Total P&L</div>
          <div className={`text-2xl font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}${Math.abs(totalPnl).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Win Rate</div>
          <div className="text-2xl font-mono font-bold text-cyan-400">
            {pnl?.win_rate ? (pnl.win_rate * 100).toFixed(1) : '0'}%
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Total Trades</div>
          <div className="text-lg font-mono text-white">{pnl?.total_trades || 0}</div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Wins / Losses</div>
          <div className="text-lg font-mono">
            <span className="text-green-400">{pnl?.wins || 0}</span>
            <span className="text-slate-500"> / </span>
            <span className="text-red-400">{pnl?.losses || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentDetailModal({ agent, events, onClose, onRestart }) {
  if (!agent) return null;

  const agentEvents = events.filter((event) => event.agent === agent.name);
  const lastHeartbeat = agentEvents.find((event) => event.type === 'heartbeat');
  const recentActivity = agentEvents.filter((event) => event.type !== 'heartbeat').slice(0, 5);
  const fallbackActivity = events.filter((event) => event.type !== 'heartbeat').slice(0, 5);
  const description = AGENT_DESCRIPTIONS[agent.name] || AGENT_DESCRIPTIONS[agent.module] || 'Agent description pending.';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-xl w-full overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{agent.name}</h2>
            <p className="text-sm text-slate-400">{agent.module || 'crypto agent'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-slate-700/40 rounded p-3 text-sm text-slate-200 border border-slate-600">
            {description}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-xs text-slate-400">Status</div>
              <div className={`font-bold ${agent.running ? 'text-green-400' : 'text-red-400'}`}>
                {agent.running ? 'RUNNING' : 'STOPPED'}
              </div>
            </div>
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-xs text-slate-400">PID</div>
              <div className="font-mono text-white">{agent.pid || 'N/A'}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-xs text-slate-400">CPU</div>
              <div className="font-mono text-white">{agent.cpu ? `${agent.cpu}%` : 'N/A'}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-xs text-slate-400">MEM</div>
              <div className="font-mono text-white">{agent.mem ? `${agent.mem}%` : 'N/A'}</div>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded p-3 text-sm">
            <div className="text-xs text-slate-400">Last Heartbeat</div>
            <div className="text-white">
              {lastHeartbeat
                ? new Date(lastHeartbeat.timestamp).toLocaleString()
                : 'No heartbeat yet'}
            </div>
          </div>

          <div className="bg-slate-700/50 rounded p-3 text-sm">
            <div className="text-xs text-slate-400 mb-2">Recent Activity</div>
            {recentActivity.length > 0 ? (
              <div className="space-y-1">
                {recentActivity.map((event, idx) => (
                  <div key={idx} className="text-slate-300">
                    {new Date(event.timestamp).toLocaleTimeString()} • {event.message || event.type}
                  </div>
                ))}
              </div>
            ) : fallbackActivity.length > 0 ? (
              <div className="space-y-1">
                {fallbackActivity.map((event, idx) => (
                  <div key={idx} className="text-slate-300">
                    {new Date(event.timestamp).toLocaleTimeString()} • {event.message || event.type}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400">No recent activity.</div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={() => onRestart(agent)}
            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30"
          >
            Restart Agent
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Crypto Tab Component
export function CryptoTab() {
  const api = useApi();
  const [status, setStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [trades, setTrades] = useState([]);
  const [pnl, setPnl] = useState(null);
  const [dcaWatchlist, setDcaWatchlist] = useState({ tokens: {}, labels: {}, blacklist: [] });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [eventsUpdatedAt, setEventsUpdatedAt] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [tradesDebug, setTradesDebug] = useState(null);
  const debugStatus = import.meta.env?.VITE_DEBUG_STATUS === 'true';

  const fetchData = async () => {
    try {
      const [statusResult, eventsResult, tradesResult, pnlResult, dcaResult] = await Promise.allSettled([
        api.fetchApi('/api/crypto/status'),
        api.fetchApi('/api/crypto/events?limit=20'),
        api.fetchApi('/api/crypto/trades?limit=10'),
        api.fetchApi('/api/crypto/pnl'),
        api.fetchApi('/api/crypto/dca-watchlist'),
      ]);

      if (statusResult.status === 'fulfilled') {
        const statusData = statusResult.value;
        const normalizedAgents = Array.isArray(statusData?.agents)
          ? statusData.agents.map((agent) => ({
              ...agent,
              name: agent.name || agent.module || 'agent',
              running: typeof agent.running === 'boolean'
                ? agent.running
                : agent.status === 'running',
            }))
          : [];
        setStatus({ ...statusData, agents: normalizedAgents });
      }

      if (eventsResult.status === 'fulfilled') {
        setEvents(eventsResult.value?.events || []);
        setEventsUpdatedAt(new Date());
      }

      if (tradesResult.status === 'fulfilled') {
        const tradesData = tradesResult.value?.trades || [];
        setTrades(tradesData);
        setTradesDebug({
          status: 'ok',
          count: tradesData.length,
          firstIds: tradesData.slice(0, 3).map((t) => t.id),
          firstTrade: tradesData[0] ? Object.keys(tradesData[0]) : [],
        });
      } else {
        setTradesDebug({ status: 'failed', error: tradesResult.reason?.message });
      }

      if (pnlResult.status === 'fulfilled') {
        setPnl(pnlResult.value);
      }

      if (dcaResult.status === 'fulfilled') {
        setDcaWatchlist(dcaResult.value || { tokens: {}, labels: {}, blacklist: [] });
      }
    } catch (e) {
      console.error('Failed to fetch crypto data:', e);
    }
    setLoading(false);
  };

  const refreshEvents = async () => {
    try {
      const eventsData = await api.fetchApi('/api/crypto/events?limit=20');
      setEvents(eventsData?.events || []);
      setEventsUpdatedAt(new Date());
    } catch (e) {
      console.error('Failed to refresh events:', e);
    }
  };

  const handleRestartAgent = async (agent) => {
    try {
      await api.fetchApi('/api/crypto/restart', {
        method: 'POST',
        body: JSON.stringify({ name: agent.name }),
      });
    } catch (e) {
      console.error('Restart failed:', e);
    }
  };

  useEffect(() => {
    fetchData();
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-slate-400">Loading crypto data...</p>
      </div>
    );
  }

  const lastSignal = events.find((event) => event.signals_found > 0);
  const hoursSinceSignal = lastSignal
    ? Math.floor((Date.now() - new Date(lastSignal.timestamp).getTime()) / 3600000)
    : Math.floor((Date.now() - (eventsUpdatedAt?.getTime() || Date.now())) / 3600000);
  const hasSignals = events.some((event) => event.signals_found > 0);

  const labelStyles = {
    HOLD_FOREVER: 'bg-green-500/20 text-green-300 border-green-500/30',
    HOLD_1YEAR: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    SWING_TRADE: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    DAY_TRADE: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    AVOID: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  const tokens = Object.entries(dcaWatchlist?.tokens || {});
  const blacklist = dcaWatchlist?.blacklist || [];

  return (
    <div className="px-4 space-y-6">
      {/* Diagnostics Panel - gated behind VITE_DEBUG_STATUS */}
      {debugStatus && (
        <div style={{ background: '#1a1a2e', border: '2px solid #e94560', borderRadius: 8, padding: 12, fontSize: 11, fontFamily: 'monospace' }}>
          <div style={{ color: '#e94560', fontWeight: 'bold', marginBottom: 8 }}>🔬 CRYPTO DIAGNOSTICS</div>
          <div style={{ color: '#0f0' }}>Trades API: {tradesDebug?.status || 'pending'}</div>
          <div style={{ color: '#ff0' }}>trades.length: {trades.length}</div>
          <div style={{ color: '#ff0' }}>First 3 IDs: {JSON.stringify(tradesDebug?.firstIds || [])}</div>
          <div style={{ color: '#888' }}>First trade keys: {JSON.stringify(tradesDebug?.firstTrade || [])}</div>
          {tradesDebug?.error && <div style={{ color: '#f00' }}>Error: {tradesDebug.error}</div>}
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🪙</span> Crypto Trading Desk
        </h1>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded"
          />
          Auto-refresh (5s)
        </label>
      </div>

      {/* Agent Status Grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🤖</span> Swarm Status
          </h2>
          <div className="flex items-center gap-2">
            <span
              className="text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-full px-2 py-1"
              title={status?.timestamp ? `Last update: ${new Date(status.timestamp).toLocaleString()}` : undefined}
            >
              {status?.running ?? 0}/{status?.total ?? 0} running
            </span>
            <span
              className={`text-xs font-semibold rounded-full px-2 py-1 ${
                status?.status === 'healthy'
                  ? 'bg-green-500/20 text-green-400'
                  : status?.status === 'degraded'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
              }`}
            >
              {(status?.status || 'offline').toUpperCase()}
            </span>
            {status?.timestamp && (
              <span className="text-xs text-slate-500">
                updated {new Date(status.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {status?.agents?.map((agent, i) => (
            <AgentStatus
              key={i}
              {...agent}
              onClick={() => setSelectedAgent(agent)}
            />
          )) || (
            <>
              <AgentStatus name="Coordinator" running={false} onClick={() => setSelectedAgent({ name: 'Coordinator' })} />
              <AgentStatus name="Scanner" running={false} onClick={() => setSelectedAgent({ name: 'Scanner' })} />
              <AgentStatus name="Risk Manager" running={false} onClick={() => setSelectedAgent({ name: 'Risk Manager' })} />
              <AgentStatus name="Momentum Trader" running={false} onClick={() => setSelectedAgent({ name: 'Momentum Trader' })} />
              <AgentStatus name="Dip Buyer" running={false} onClick={() => setSelectedAgent({ name: 'Dip Buyer' })} />
            </>
          )}
        </div>
      </section>

      {/* P&L and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PnLCard pnl={pnl} />

        {/* Quick Stats */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-3">📊 Today's Activity</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Scans</span>
              <span className="font-mono text-white">{status?.scans_today || events.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Signals</span>
              <span className="font-mono text-cyan-400">{status?.signals_today || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Trades</span>
              <span className="font-mono text-white">{status?.trades_today || trades.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Positions</span>
              <span className="font-mono text-yellow-400">{status?.active_positions || 0}</span>
            </div>
          </div>
        </div>

        {/* Config */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-3">⚙️ Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Position Size</span>
              <span className="font-mono text-white">${status?.config?.position_size || 100}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Momentum Threshold</span>
              <span className="font-mono text-cyan-400">{status?.config?.momentum_threshold || 1}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dip Threshold</span>
              <span className="font-mono text-orange-400">{status?.config?.dip_threshold || 1.5}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mode</span>
              <span className={`px-1.5 py-0.5 rounded text-xs ${status?.config?.mode === 'live' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                {status?.config?.mode?.toUpperCase() || 'PAPER'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DCA Watchlist */}
      <section className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🧭</span> DCA Watchlist
            </h2>
            <p className="text-xs text-slate-400">
              Labels drive behavior; drawdown uses local cache (no external pricing).
            </p>
          </div>
          {blacklist.length > 0 && (
            <div className="text-xs text-slate-400">
              Blacklist: <span className="text-red-400">{blacklist.join(', ')}</span>
            </div>
          )}
        </div>
        {tokens.length === 0 ? (
          <div className="text-slate-400 text-sm">No DCA tokens configured.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {tokens.map(([symbol, token]) => {
              const label = token.label || 'UNKNOWN';
              const badgeClass = labelStyles[label] || 'bg-slate-700 text-slate-200 border-slate-600';
              const drawdown = token.drawdown_pct;
              const drawdownDisplay =
                typeof drawdown === 'number' ? `${drawdown.toFixed(2)}%` : 'n/a';
              return (
                <div key={symbol} className="border border-slate-700 rounded-lg p-3 bg-slate-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-bold text-white">{symbol}</div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${badgeClass}`}>
                      {label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{token.thesis}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>
                      DCA trigger
                      <div className="text-white font-mono">
                        {(token.dca_trigger * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      Take profit
                      <div className="text-white font-mono">
                        {token.take_profit ? `${token.take_profit}x` : '—'}
                      </div>
                    </div>
                    <div>
                      Drawdown
                      <div className="text-white font-mono">{drawdownDisplay}</div>
                    </div>
                    <div>
                      Price
                      <div className="text-white font-mono">
                        {token.price ? `$${Number(token.price).toFixed(2)}` : 'n/a'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Events and Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events Feed */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>📡</span> Live Events
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          </h2>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={refreshEvents}
              className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-200"
            >
              Refresh
            </button>
            <span className="text-xs text-slate-500">
              {eventsUpdatedAt ? `Updated ${eventsUpdatedAt.toLocaleTimeString()}` : 'No updates yet'}
            </span>
          </div>
          {!hasSignals && (
            <div className="text-xs text-slate-500 mb-3">
              No signals in last {Math.max(hoursSinceSignal, 0)} hours.
            </div>
          )}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events.length > 0 ? (
              events.map((event, i) => <EventCard key={i} event={event} />)
            ) : (
              <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
                No events yet. Agents may be starting up.
              </div>
            )}
          </div>
        </section>

        {/* Recent Trades */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>💹</span> Recent Trades
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {trades.length > 0 ? (
              trades.map((trade, i) => <TradeCard key={i} trade={trade} />)
            ) : (
              <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
                No trades recorded yet. Waiting for signals.
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          events={events}
          onClose={() => setSelectedAgent(null)}
          onRestart={handleRestartAgent}
        />
      )}
    </div>
  );
}
