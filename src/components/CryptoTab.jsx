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
function TradeCard({ trade, onClick }) {
  const pnl = trade.pnl_dollars ?? trade.pnl ?? 0;
  const isWin = trade.win || pnl > 0;
  const size = trade.size ?? trade.size_usd ?? 0;
  const pnlPct = trade.pnl_pct ?? 0;
  const action = trade.action || trade.side || '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-lg border w-full text-left transition-colors cursor-pointer hover:border-cyan-500/60 ${isWin ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}
    >
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
    </button>
  );
}

// Trade Detail Modal
function TradeDetailModal({ trade, onClose }) {
  const safeTrade = trade || {};
  const pnl = safeTrade.pnl_dollars ?? safeTrade.pnl ?? 0;
  const isWin = safeTrade.win || pnl > 0;
  const size = safeTrade.size ?? safeTrade.size_usd ?? 0;
  const pnlPct = safeTrade.pnl_pct ?? 0;
  const action = safeTrade.action || safeTrade.side || '';
  const entryTime = safeTrade.entry_time ? new Date(safeTrade.entry_time) : null;
  const exitTime = safeTrade.exit_time ? new Date(safeTrade.exit_time) : null;
  const durationLabel = entryTime && exitTime
    ? formatDuration(exitTime.getTime() - entryTime.getTime())
    : '—';
  const tradeId = safeTrade.trade_id || safeTrade.id || safeTrade.order_id;
  const noteKeyBase = tradeId || `${safeTrade.symbol || safeTrade.pair || 'trade'}:${safeTrade.exit_time || safeTrade.entry_time || ''}`;
  const noteStorageKey = `crypto_trade_note:${noteKeyBase}`;
  const [note, setNote] = useState('');
  const [noteStatus, setNoteStatus] = useState('saved');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!trade) return;
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(noteStorageKey);
    setNote(stored || '');
    setNoteStatus('saved');
  }, [noteStorageKey, trade]);

  const handleSaveNote = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(noteStorageKey, note);
    setNoteStatus('saved');
  };

  const stopPrice = safeTrade.stop_price;
  const entryPrice = safeTrade.entry_price;
  const riskDollars = entryPrice && stopPrice && size
    ? (Math.abs(entryPrice - stopPrice) / entryPrice) * size
    : null;
  const rMultiple = riskDollars && riskDollars > 0 ? pnl / riskDollars : null;

  const handleCopy = async () => {
    const symbol = safeTrade.symbol || safeTrade.pair || 'N/A';
    const entry = safeTrade.entry_price ?? '—';
    const exit = safeTrade.exit_price ?? '—';
    const stop = safeTrade.stop_price ?? safeTrade.stop ?? '—';
    const target = safeTrade.target ?? safeTrade.take_profit ?? '—';
    const mode = safeTrade.mode || safeTrade.trade_mode || 'paper';
    const reason = safeTrade.exit_reason || safeTrade.reason || '—';
    const entryEt = formatTimeEt(safeTrade.entry_time);
    const exitEt = formatTimeEt(safeTrade.exit_time);
    const entryReason = safeTrade.entry_reason || safeTrade.signal?.reasoning || '—';
    const pnlPercent = (pnlPct * 100).toFixed(2);
    const sizeUsd = Number.isFinite(size) ? size.toFixed(2) : size;
    const text = [
      `Trade: ${symbol}`,
      `Mode: ${mode}`,
      `Trade ID: ${tradeId || '—'}`,
      `Entry: ${entry} | Exit: ${exit}`,
      `Size USD: ${sizeUsd}`,
      `P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent}%)`,
      `Reason: ${reason}`,
      `Entry Time (ET): ${entryEt}`,
      `Exit Time (ET): ${exitEt}`,
      `Hold Duration: ${durationLabel}`,
      `Thresholds: stop=${stop} target=${target}`,
      `Entry Logic: ${entryReason}`,
      `Journal Note: ${note || '—'}`,
    ].join('\n');

    const doClipboardCopy = async () => {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    };

    let copiedOk = false;
    try {
      copiedOk = await doClipboardCopy();
    } catch (e) {
      copiedOk = false;
    }

    if (!copiedOk) {
      try {
        const temp = document.createElement('textarea');
        temp.value = text;
        temp.setAttribute('readonly', '');
        temp.style.position = 'absolute';
        temp.style.left = '-9999px';
        document.body.appendChild(temp);
        temp.select();
        temp.setSelectionRange(0, temp.value.length);
        document.execCommand('copy');
        document.body.removeChild(temp);
      } catch (e) {
        return;
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!trade) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{trade.pair || trade.symbol}</h2>
            <div className="flex gap-2 mt-1">
              {action && (
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${action === 'LONG' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {action}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${isWin ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {isWin ? 'WIN' : 'LOSS'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs px-3 py-1 rounded border border-slate-500 text-slate-200 hover:bg-slate-700/60"
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-400">Entry Price</div>
              <div className="text-lg font-mono text-white">${trade.entry_price?.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Exit Price</div>
              <div className="text-lg font-mono text-white">${trade.exit_price?.toFixed(4)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-400">Size (USD)</div>
              <div className="text-lg font-mono text-white">${size.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">P&L</div>
              <div className={`text-lg font-mono font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({(pnlPct * 100).toFixed(2)}%)
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-400">Exit Reason</div>
                <div className="text-white capitalize">{trade.exit_reason || 'N/A'}</div>
              </div>
              <div>
                <div className="text-slate-400">Trade ID</div>
                <div className="text-white font-mono text-xs">{tradeId || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-400">Entry Time (ET)</div>
                <div className="text-white text-xs">{formatTimeEt(trade.entry_time)}</div>
              </div>
              <div>
                <div className="text-slate-400">Exit Time (ET)</div>
                <div className="text-white text-xs">{formatTimeEt(trade.exit_time)}</div>
              </div>
              <div>
                <div className="text-slate-400">Hold Duration</div>
                <div className="text-white text-xs">{durationLabel}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-400">Stop Price</div>
                <div className="text-white text-xs">
                  {stopPrice ? `$${Number(stopPrice).toFixed(4)}` : '—'}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Risk (USD)</div>
                <div className="text-white text-xs">
                  {riskDollars ? `$${riskDollars.toFixed(2)}` : 'n/a'}
                </div>
              </div>
              <div>
                <div className="text-slate-400">R Multiple</div>
                <div className="text-white text-xs">
                  {rMultiple !== null ? `${rMultiple.toFixed(2)}R` : 'n/a'}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-400">Journal Notes</div>
              <div className="text-xs text-slate-500">
                {noteStatus === 'saved' ? 'Saved' : 'Unsaved'}
              </div>
            </div>
            <textarea
              className="w-full bg-slate-900/60 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
              rows={3}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setNoteStatus('unsaved');
              }}
              placeholder="Add a quick note about this trade..."
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleSaveNote}
                className="text-xs px-3 py-1 rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
              >
                Save Note
              </button>
            </div>
          </div>

          {trade.signal?.reasoning && (
            <div className="border-t border-slate-700 pt-3">
              <div className="text-sm text-slate-400">Signal Reasoning</div>
              <div className="text-white text-sm mt-1">{trade.signal.reasoning}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}

function formatTimeEt(value) {
  if (!value) return '—';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-US', { timeZone: 'America/New_York' });
}

function getEtDate(value) {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function PerSymbolTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <div className="text-xs text-slate-500">No data available.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-slate-300 border-collapse">
        <thead>
          <tr className="text-slate-500">
            <th className="text-left py-1">Symbol</th>
            <th className="text-right py-1">Trades</th>
            <th className="text-right py-1">Wins</th>
            <th className="text-right py-1">Losses</th>
            <th className="text-right py-1">Win Rate</th>
            <th className="text-right py-1">P&L</th>
            <th className="text-right py-1">Avg/Trade</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.symbol} className="border-t border-slate-700/50">
              <td className="py-1 font-mono text-white">{row.symbol}</td>
              <td className="py-1 text-right">{row.trades}</td>
              <td className="py-1 text-right text-green-400">{row.wins}</td>
              <td className="py-1 text-right text-red-400">{row.losses}</td>
              <td className="py-1 text-right">{(row.win_rate * 100).toFixed(1)}%</td>
              <td className={`py-1 text-right ${row.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {row.total_pnl >= 0 ? '+' : '-'}${Math.abs(row.total_pnl ?? 0).toFixed(2)}
              </td>
              <td className="py-1 text-right">${(row.avg_pnl ?? 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TodaySummaryModal({ status, summaryToday, perSymbolToday, sessionToday, trades, onSelectTrade, onClose }) {
  const today = summaryToday?.today_date || getEtDate(new Date()) || new Date().toISOString().slice(0, 10);
  const todaysTrades = trades.filter((trade) => getEtDate(trade.exit_time) === today);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full border border-slate-600 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Today Summary</h2>
            <div className="text-sm text-slate-400">{today}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-6">
          <div>
            <div className="text-slate-400">Today P&L</div>
            <div className={`font-mono text-lg ${summaryToday?.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summaryToday?.total_pnl >= 0 ? '+' : '-'}${Math.abs(summaryToday?.total_pnl ?? 0).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Trades</div>
            <div className="text-white font-mono text-lg">{summaryToday?.total_trades ?? 0}</div>
          </div>
          <div>
            <div className="text-slate-400">Wins / Losses</div>
            <div className="text-white font-mono">
              <span className="text-green-400">{summaryToday?.wins ?? 0}</span>
              <span className="text-slate-500"> / </span>
              <span className="text-red-400">{summaryToday?.losses ?? 0}</span>
            </div>
          </div>
          <div>
            <div className="text-slate-400">Win Rate</div>
            <div className="text-cyan-400 font-mono text-lg">
              {(summaryToday?.win_rate ? summaryToday.win_rate * 100 : 0).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-slate-400">Avg Win</div>
            <div className="text-green-400 font-mono">+${(summaryToday?.avg_win ?? 0).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-slate-400">Avg Loss</div>
            <div className="text-red-400 font-mono">${(summaryToday?.avg_loss ?? 0).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-slate-400">Profit Factor</div>
            <div className="text-white font-mono">
              {summaryToday?.profit_factor === Infinity ? '∞' : (summaryToday?.profit_factor ?? 0).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-slate-400">Active Positions</div>
            <div className="text-yellow-400 font-mono">{status?.active_positions ?? 0}</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">Today by Symbol</h3>
          <PerSymbolTable rows={[...(perSymbolToday || [])].sort((a, b) => b.total_pnl - a.total_pnl)} />
        </div>

        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-700/40 rounded p-3">
            <div className="text-xs text-slate-400 mb-2">Sessions</div>
            {sessionToday?.sessions?.length ? (
              <div className="space-y-2 text-xs text-slate-200">
                {sessionToday.sessions.map((session) => (
                  <div key={session.session} className="flex justify-between">
                    <span className="capitalize">{session.session.replace(/_/g, ' ')}</span>
                    <span>
                      {session.trades} trades • {session.wins}/{session.losses} • {session.total_pnl >= 0 ? '+' : '-'}${Math.abs(session.total_pnl).toFixed(2)} • {formatDuration((session.avg_duration_seconds || 0) * 1000)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500">No session data yet.</div>
            )}
          </div>
          <div className="bg-slate-700/40 rounded p-3">
            <div className="text-xs text-slate-400 mb-2">By Exit Reason</div>
            {sessionToday?.by_reason?.length ? (
              <div className="space-y-2 text-xs text-slate-200">
                {sessionToday.by_reason.map((reason) => (
                  <div key={reason.reason} className="flex justify-between">
                    <span className="capitalize">{reason.reason.replace(/_/g, ' ')}</span>
                    <span>
                      {reason.trades} trades • {reason.wins}/{reason.losses} • {reason.total_pnl >= 0 ? '+' : '-'}${Math.abs(reason.total_pnl).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500">No exit data yet.</div>
            )}
          </div>
        </div>

        <div className="bg-slate-700/50 rounded p-3 text-sm">
          <div className="text-xs text-slate-400 mb-2">Today's Trades</div>
          {todaysTrades.length === 0 ? (
            <div className="text-slate-400 text-xs">No trades today.</div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-auto pointer-events-auto">
              {todaysTrades.map((trade, idx) => (
                <button
                  key={trade.trade_id || trade.id || idx}
                  type="button"
                  onPointerUp={() => onSelectTrade(trade)}
                  onClick={() => onSelectTrade(trade)}
                  aria-label={`Open trade ${trade.symbol || trade.pair || 'trade'}`}
                  className="w-full text-left cursor-pointer text-xs text-slate-200 border-b border-slate-600/40 pb-2 hover:text-white hover:bg-slate-700/40 active:bg-slate-700/50 rounded px-2 py-1 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400/40 pointer-events-auto"
                >
                  <div className="text-slate-400">
                    {trade.symbol || trade.pair} • {formatTimeEt(trade.entry_time)} → {formatTimeEt(trade.exit_time)}
                  </div>
                  <div className="flex justify-between">
                    <span>P&L: {trade.pnl_dollars ?? trade.pnl ?? 0}</span>
                    <span>{trade.exit_reason || '—'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// All-Time Summary Card
function PnLCard({ summaryAll, summaryToday, firstTradeTime, onClick }) {
  const totalPnl = summaryAll?.total_pnl ?? 0;
  const dailyPnl = summaryToday?.total_pnl ?? 0;
  const isPositive = totalPnl >= 0;
  const isDailyPositive = dailyPnl >= 0;

  const firstTradeDate = firstTradeTime
    ? new Date(firstTradeTime).toLocaleDateString()
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-slate-800 rounded-lg p-4 border border-slate-700 w-full text-left transition-colors cursor-pointer hover:border-cyan-500/60 hover:bg-slate-800/80"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">📘 All-Time Summary</h3>
        <div className="flex items-center gap-2">
          {firstTradeDate && (
            <span className="text-xs text-slate-500">Since {firstTradeDate}</span>
          )}
          <span className="text-xs text-slate-400">tap for details</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-slate-400">All-Time P&L</div>
          <div className={`text-2xl font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : '-'}${Math.abs(totalPnl).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Today ({summaryToday?.today_date || 'N/A'})</div>
          <div className={`text-2xl font-mono font-bold ${isDailyPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isDailyPositive ? '+' : '-'}${Math.abs(dailyPnl).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Win Rate</div>
          <div className="text-xl font-mono font-bold text-cyan-400">
            {summaryAll?.win_rate ? (summaryAll.win_rate * 100).toFixed(1) : '0'}%
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Trades (All / Today)</div>
          <div className="text-lg font-mono text-white">
            {summaryAll?.total_trades ?? 0}
            <span className="text-slate-500"> / </span>
            <span className="text-cyan-400">{summaryToday?.total_trades ?? 0}</span>
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-sm text-slate-400">Wins / Losses</div>
          <div className="text-lg font-mono">
            <span className="text-green-400">{summaryAll?.wins ?? 0}</span>
            <span className="text-slate-500"> / </span>
            <span className="text-red-400">{summaryAll?.losses ?? 0}</span>
            <span className="text-slate-500 text-sm ml-2">
              (today: <span className="text-green-400">{summaryToday?.wins ?? 0}</span>
              /<span className="text-red-400">{summaryToday?.losses ?? 0}</span>)
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function TodaySummaryCard({ summaryToday, onClick }) {
  const dailyPnl = summaryToday?.total_pnl ?? 0;
  const isDailyPositive = dailyPnl >= 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-slate-800 rounded-lg p-4 border border-slate-700 w-full text-left transition-colors cursor-pointer hover:border-cyan-500/60 hover:bg-slate-800/80"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">📊 Today Summary</h3>
        <span className="text-xs text-slate-400">tap for details</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-slate-400">Today P&L</div>
          <div className={`text-2xl font-mono font-bold ${isDailyPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isDailyPositive ? '+' : '-'}${Math.abs(dailyPnl).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Trades</div>
          <div className="text-xl font-mono text-white">{summaryToday?.total_trades ?? 0}</div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Wins / Losses</div>
          <div className="text-lg font-mono">
            <span className="text-green-400">{summaryToday?.wins ?? 0}</span>
            <span className="text-slate-500"> / </span>
            <span className="text-red-400">{summaryToday?.losses ?? 0}</span>
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Win Rate</div>
          <div className="text-xl font-mono text-cyan-400">
            {(summaryToday?.win_rate ? summaryToday.win_rate * 100 : 0).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Avg Win</div>
          <div className="text-lg font-mono text-green-400">+${(summaryToday?.avg_win ?? 0).toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Avg Loss</div>
          <div className="text-lg font-mono text-red-400">${(summaryToday?.avg_loss ?? 0).toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Profit Factor</div>
          <div className="text-xl font-mono text-white">
            {summaryToday?.profit_factor === Infinity ? '∞' : (summaryToday?.profit_factor ?? 0).toFixed(2)}
          </div>
        </div>
      </div>
    </button>
  );
}

// Crypto Performance Modal - detailed P&L drill-down
function CryptoPnlModal({ summaryAll, summaryToday, perSymbolAll, firstTradeTime, onClose }) {
  if (!summaryAll) return null;

  const totalPnl = summaryAll.total_pnl ?? 0;
  const isPositive = totalPnl >= 0;
  const firstTradeDate = firstTradeTime
    ? new Date(firstTradeTime).toLocaleString()
    : 'N/A';

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg p-6 max-w-lg w-full border border-slate-600 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">All-Time Performance</h2>
            <p className="text-sm text-slate-400">Since {firstTradeDate}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* All-Time Summary */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">All-Time</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-400">Total P&L</div>
              <div className={`text-2xl font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : '-'}${Math.abs(totalPnl).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Win Rate</div>
              <div className="text-2xl font-mono font-bold text-cyan-400">
                {summaryAll.win_rate ? (summaryAll.win_rate * 100).toFixed(1) : '0'}%
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Total Trades</div>
              <div className="text-lg font-mono text-white">{summaryAll.total_trades ?? 0}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Wins / Losses</div>
              <div className="text-lg font-mono">
                <span className="text-green-400">{summaryAll.wins ?? 0}</span>
                <span className="text-slate-500"> / </span>
                <span className="text-red-400">{summaryAll.losses ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 border-t border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
            Today ({summaryToday?.today_date || 'N/A'})
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-400">Daily P&L</div>
              <div className={`text-xl font-mono font-bold ${summaryToday?.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summaryToday?.total_pnl >= 0 ? '+' : '-'}${Math.abs(summaryToday?.total_pnl ?? 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Daily Trades</div>
              <div className="text-lg font-mono text-white">{summaryToday?.total_trades ?? 0}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-slate-400">Daily Wins / Losses</div>
              <div className="text-lg font-mono">
                <span className="text-green-400">{summaryToday?.wins ?? 0}</span>
                <span className="text-slate-500"> / </span>
                <span className="text-red-400">{summaryToday?.losses ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Per-Symbol (All-Time)</h3>
          <PerSymbolTable rows={[...(perSymbolAll || [])].sort((a, b) => b.total_pnl - a.total_pnl)} />
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
  const [summaryAll, setSummaryAll] = useState(null);
  const [summaryToday, setSummaryToday] = useState(null);
  const [perSymbolAll, setPerSymbolAll] = useState([]);
  const [perSymbolToday, setPerSymbolToday] = useState([]);
  const [sessionToday, setSessionToday] = useState(null);
  const [firstTradeTime, setFirstTradeTime] = useState(null);
  const [todayDateEt, setTodayDateEt] = useState(null);
  const [dcaWatchlist, setDcaWatchlist] = useState({ tokens: {}, labels: {}, blacklist: [] });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [eventsUpdatedAt, setEventsUpdatedAt] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showPnlModal, setShowPnlModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [tradesDebug, setTradesDebug] = useState(null);
  const debugStatus = import.meta.env?.VITE_DEBUG_STATUS === 'true';

  const fetchData = async () => {
    try {
      // Single source of truth: trades endpoint now returns both trades AND summary
      const [statusResult, eventsResult, tradesResult, dcaResult] = await Promise.allSettled([
        api.fetchApi('/api/crypto/status'),
        api.fetchApi('/api/crypto/events?limit=20'),
        api.fetchApi('/api/crypto/trades?limit=10'),
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

      // Unified trades + summary from single endpoint (single source of truth)
      if (tradesResult.status === 'fulfilled') {
        const tradesData = tradesResult.value?.trades || [];
        const summaryAllData = tradesResult.value?.summary_all_time || tradesResult.value?.summary || null;
        const summaryTodayData = tradesResult.value?.summary_today || null;
        const perSymbolAllData = tradesResult.value?.per_symbol_all_time || [];
        const perSymbolTodayData = tradesResult.value?.per_symbol_today || [];
        const sessionTodayData = tradesResult.value?.session_today || null;
        const firstTrade = tradesResult.value?.first_trade_time || summaryAllData?.first_trade_time || null;
        const todayEt = tradesResult.value?.today_date_et || summaryTodayData?.today_date || null;
        setTrades(tradesData);
        setSummaryAll(summaryAllData);
        setSummaryToday(summaryTodayData);
        setPerSymbolAll(perSymbolAllData);
        setPerSymbolToday(perSymbolTodayData);
        setSessionToday(sessionTodayData);
        setFirstTradeTime(firstTrade);
        setTodayDateEt(todayEt);
        setTradesDebug({
          status: 'ok',
          endpoint: '/api/crypto/trades',
          tradesCount: tradesData.length,
          summaryPresent: !!summaryAllData,
          totalPnl: summaryAllData?.total_pnl,
          totalTrades: summaryAllData?.total_trades,
          dailyTrades: summaryTodayData?.total_trades,
          firstTradeTime: firstTrade,
        });
      } else {
        setTradesDebug({ status: 'failed', error: tradesResult.reason?.message });
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

  const openTradeFromActivity = (trade) => {
    setShowActivityModal(false);
    setTimeout(() => setSelectedTrade(trade), 0);
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

  const sessionStatus = status?.status === 'healthy' ? 'OPEN' : 'CLOSED';

  return (
    <div className="px-4 space-y-6">
      {/* Diagnostics Panel - gated behind VITE_DEBUG_STATUS */}
      {debugStatus && (
        <div style={{ background: '#1a1a2e', border: '2px solid #e94560', borderRadius: 8, padding: 12, fontSize: 11, fontFamily: 'monospace' }}>
          <div style={{ color: '#e94560', fontWeight: 'bold', marginBottom: 8 }}>🔬 CRYPTO DIAGNOSTICS (Single Source of Truth)</div>
          <div style={{ color: '#0f0' }}>API Status: {tradesDebug?.status || 'pending'}</div>
          <div style={{ color: '#0f0' }}>Endpoint: {tradesDebug?.endpoint || 'N/A'}</div>
          <div style={{ color: '#ff0' }}>trades.length (displayed): {trades.length}</div>
          <div style={{ color: '#ff0' }}>summary.total_trades (all-time): {tradesDebug?.totalTrades ?? 'N/A'}</div>
          <div style={{ color: '#ff0' }}>summary.daily_trades (today): {tradesDebug?.dailyTrades ?? 'N/A'}</div>
          <div style={{ color: '#0ff' }}>summary.total_pnl: ${tradesDebug?.totalPnl?.toFixed(2) ?? 'N/A'}</div>
          <div style={{ color: '#888' }}>first_trade_time: {tradesDebug?.firstTradeTime || 'N/A'}</div>
          <div style={{ color: summaryAll ? '#0f0' : '#f00' }}>Summary present: {tradesDebug?.summaryPresent ? 'YES' : 'NO'}</div>
          {tradesDebug?.error && <div style={{ color: '#f00' }}>Error: {tradesDebug.error}</div>}
        </div>
      )}
      {/* Journal Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🪙</span> Crypto Daily Journal
          </h1>
          <div className="text-xs text-slate-500 mt-1">
            {todayDateEt || summaryToday?.today_date || new Date().toISOString().slice(0, 10)} • Session {sessionStatus}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="bg-slate-800 border border-slate-700 rounded px-3 py-2">
            <div className="text-slate-500">Mode</div>
            <div className="text-white font-mono">{status?.config?.mode?.toUpperCase() || 'PAPER'}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded px-3 py-2">
            <div className="text-slate-500">Position Size</div>
            <div className="text-white font-mono">${status?.config?.position_size || status?.config?.position_size_usd || 100}</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded px-3 py-2">
            <div className="text-slate-500">Thresholds</div>
            <div className="text-white font-mono">
              M {status?.config?.momentum_threshold || 1}% • D {status?.config?.dip_threshold || 1.5}%
            </div>
          </div>
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
        <TodaySummaryCard summaryToday={summaryToday} onClick={() => setShowActivityModal(true)} />
        <PnLCard
          summaryAll={summaryAll}
          summaryToday={summaryToday}
          firstTradeTime={firstTradeTime}
          onClick={() => setShowPnlModal(true)}
        />
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-3">⚙️ Session Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Scans</span>
              <span className="font-mono text-white">{status?.scans_today || events.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Signals</span>
              <span className="font-mono text-cyan-400">{status?.signals_today || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Positions</span>
              <span className="font-mono text-yellow-400">{status?.active_positions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Session</span>
              <span className={`px-1.5 py-0.5 rounded text-xs ${sessionStatus === 'OPEN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {sessionStatus}
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
              trades.map((trade, i) => (
                <TradeCard
                  key={i}
                  trade={trade}
                  onClick={() => setSelectedTrade(trade)}
                />
              ))
            ) : (
              <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
                No trades recorded yet. Waiting for signals.
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
        />
      )}

      {showPnlModal && (
        <CryptoPnlModal
          summaryAll={summaryAll}
          summaryToday={summaryToday}
          perSymbolAll={perSymbolAll}
          firstTradeTime={firstTradeTime}
          onClose={() => setShowPnlModal(false)}
        />
      )}
      {showActivityModal && (
        <TodaySummaryModal
          status={status}
          summaryToday={summaryToday}
          perSymbolToday={perSymbolToday}
          sessionToday={sessionToday}
          trades={trades}
          onSelectTrade={openTradeFromActivity}
          onClose={() => setShowActivityModal(false)}
        />
      )}

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
