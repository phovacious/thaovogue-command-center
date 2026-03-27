import { formatCurrency, formatRelativeTime } from '../../types/v4Types';
import { EmptyState } from './EmptyState';

/**
 * Trade log feed - Telegram-style operational feed
 */
export function TradeLogFeed({ events = [], maxItems = 50 }) {
  if (!events || events.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No recent activity"
        description="Trade events will appear here"
      />
    );
  }

  const sortedEvents = [...events]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, maxItems);

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {sortedEvents.map((event, idx) => (
        <TradeEventCard key={`${event.timestamp}-${idx}`} event={event} />
      ))}
    </div>
  );
}

function TradeEventCard({ event }) {
  const { type, symbol, botName, pnl, price, qty, reason, timestamp } = event;

  const typeConfig = getEventTypeConfig(type);

  return (
    <div className={`p-3 rounded-lg border ${typeConfig.bgColor} ${typeConfig.borderColor}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeConfig.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeConfig.badgeColor}`}>
                {typeConfig.label}
              </span>
              {symbol && (
                <span className="font-mono font-bold text-white">{symbol}</span>
              )}
            </div>
            {botName && (
              <div className="text-xs text-slate-500 mt-0.5">{botName}</div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">{formatRelativeTime(timestamp)}</div>
          {pnl != null && (
            <div className={`font-mono text-sm font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="mt-2 text-xs text-slate-400 flex flex-wrap gap-3">
        {price && <span>Price: ${price.toFixed(2)}</span>}
        {qty && <span>Qty: {qty}</span>}
        {reason && <span className="text-slate-500">{reason}</span>}
      </div>
    </div>
  );
}

function getEventTypeConfig(type) {
  const t = (type || '').toLowerCase();

  if (t === 'entry' || t === 'buy') {
    return {
      icon: '🟢',
      label: 'ENTRY',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      badgeColor: 'bg-green-500/20 text-green-400',
    };
  }

  if (t === 'exit' || t === 'sell') {
    return {
      icon: '🔴',
      label: 'EXIT',
      bgColor: 'bg-slate-800/50',
      borderColor: 'border-slate-700/50',
      badgeColor: 'bg-slate-500/20 text-slate-300',
    };
  }

  if (t === 'tp_hit' || t === 'target_hit') {
    return {
      icon: '🎯',
      label: 'TP HIT',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      badgeColor: 'bg-green-500/20 text-green-400',
    };
  }

  if (t === 'stop_hit' || t === 'sl_hit') {
    return {
      icon: '🛑',
      label: 'STOP',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      badgeColor: 'bg-red-500/20 text-red-400',
    };
  }

  if (t === 'signal' || t === 'alert') {
    return {
      icon: '📊',
      label: 'SIGNAL',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      badgeColor: 'bg-cyan-500/20 text-cyan-400',
    };
  }

  if (t === 'regime' || t === 'regime_change') {
    return {
      icon: '🔄',
      label: 'REGIME',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      badgeColor: 'bg-yellow-500/20 text-yellow-400',
    };
  }

  if (t === 'nosedive' || t === 'crash') {
    return {
      icon: '💀',
      label: 'NOSEDIVE',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      badgeColor: 'bg-red-500/20 text-red-400',
    };
  }

  if (t === 'skip' || t === 'skipped') {
    return {
      icon: '⏭️',
      label: 'SKIPPED',
      bgColor: 'bg-slate-800/30',
      borderColor: 'border-slate-700/30',
      badgeColor: 'bg-slate-500/20 text-slate-400',
    };
  }

  return {
    icon: '📝',
    label: type?.toUpperCase() || 'EVENT',
    bgColor: 'bg-slate-800/50',
    borderColor: 'border-slate-700/50',
    badgeColor: 'bg-slate-500/20 text-slate-400',
  };
}
