import { StatusChip } from './StatusChip';
import { EmptyState } from './EmptyState';

/**
 * Fleet status grid showing per-ticker status
 */
export function FleetGrid({ items = [], title, emptyMessage }) {
  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon="🚀"
        title={emptyMessage || `No ${title || 'fleet'} items`}
      />
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <FleetRow key={`${item.ticker}-${idx}`} item={item} />
      ))}
    </div>
  );
}

function FleetRow({ item }) {
  const { ticker, signals, regime, status, drawdown } = item;

  // Determine status color
  const statusColor = getStatusColor(status);

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors">
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-white w-16">{ticker}</span>
        <div className="flex flex-wrap gap-1">
          {signals?.split('+').map((sig, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
              {sig}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {regime && (
          <span className={`text-xs ${getRegimeColor(regime)}`}>
            {regime}
          </span>
        )}
        {drawdown && (
          <span className={`font-mono text-xs ${parseFloat(drawdown) < -10 ? 'text-red-400' : 'text-slate-400'}`}>
            {drawdown}
          </span>
        )}
        <StatusChip status={status} size="xs" />
      </div>
    </div>
  );
}

function getStatusColor(status) {
  const s = (status || '').toLowerCase();
  if (s === 'active') return 'text-green-400';
  if (s === 'paused') return 'text-yellow-400';
  if (s === 'idle') return 'text-slate-400';
  if (s === 'monitor') return 'text-cyan-400';
  if (s === 'paper') return 'text-blue-400';
  return 'text-slate-400';
}

function getRegimeColor(regime) {
  const r = (regime || '').toUpperCase();
  if (r.includes('DEEP') || r.includes('BEAR') || r.includes('NOSEDIVE')) return 'text-red-400';
  if (r.includes('DIP')) return 'text-yellow-400';
  if (r.includes('NEAR HIGH') || r.includes('BULL')) return 'text-green-400';
  return 'text-slate-400';
}

/**
 * Fleet section with equity and crypto
 */
export function FleetStatusSection({ equityFleet = [], cryptoFleet = [] }) {
  return (
    <div className="space-y-6">
      {/* Equity Fleet */}
      <div>
        <h4 className="text-sm font-medium text-slate-400 mb-3">Equity Fleet</h4>
        <FleetGrid
          items={equityFleet}
          emptyMessage="No equity fleet data"
        />
      </div>

      {/* Crypto Fleet */}
      <div>
        <h4 className="text-sm font-medium text-slate-400 mb-3">Crypto Fleet</h4>
        <FleetGrid
          items={cryptoFleet}
          emptyMessage="No crypto fleet data"
        />
      </div>
    </div>
  );
}
