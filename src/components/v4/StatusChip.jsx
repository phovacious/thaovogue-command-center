import { STATUS_COLORS } from '../../types/v4Types';

/**
 * Status chip component with consistent styling
 */
export function StatusChip({ status, size = 'sm', className = '' }) {
  const statusKey = (status || 'unknown').toLowerCase();
  const colorClass = STATUS_COLORS[statusKey] || STATUS_COLORS.unknown;

  const sizeClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span className={`${sizeClass} rounded font-medium border ${colorClass} ${className}`}>
      {(status || 'UNKNOWN').toUpperCase()}
    </span>
  );
}

/**
 * Live indicator dot
 */
export function LiveDot({ isLive, size = 'sm' }) {
  const sizeClass = size === 'xs' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2';

  return (
    <span className={`inline-block rounded-full ${sizeClass} ${
      isLive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'
    }`} />
  );
}

/**
 * BTC Regime badge
 */
export function BtcRegimeBadge({ regime }) {
  const r = (regime || 'UNKNOWN').toUpperCase();

  let color = 'bg-slate-500/20 text-slate-400';
  let icon = '⚪';

  if (r === 'STRONG') {
    color = 'bg-green-500/20 text-green-400';
    icon = '🟢';
  } else if (r === 'NEUTRAL') {
    color = 'bg-yellow-500/20 text-yellow-400';
    icon = '🟡';
  } else if (r === 'WEAK') {
    color = 'bg-red-500/20 text-red-400';
    icon = '🔴';
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
      {icon} BTC: {r}
    </span>
  );
}
