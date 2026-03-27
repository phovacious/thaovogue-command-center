/**
 * V4 Type Definitions and Normalizers
 * Converts raw API data to stable frontend types
 */

// Normalize bot status from various API formats
export function normalizeBot(raw) {
  return {
    name: raw.name || 'UNKNOWN',
    status: normalizeBotStatus(raw.status),
    pid: raw.pid || null,
    symbols: raw.symbols || [],
    uptime: raw.uptime_seconds || 0,
    lastTrade: raw.last_trade || null,
    positions: raw.positions || 0,
    logFile: raw.log_file || null,
  };
}

function normalizeBotStatus(status) {
  const s = (status || '').toLowerCase();
  if (s === 'running' || s === 'active') return 'running';
  if (s === 'stopped' || s === 'inactive') return 'stopped';
  if (s === 'error') return 'error';
  return 'unknown';
}

// Normalize position from API
export function normalizePosition(raw) {
  const entryPrice = parseFloat(raw.entry_price) || 0;
  const currentPrice = parseFloat(raw.current_price) || 0;
  const qty = parseFloat(raw.qty) || 0;
  const marketValue = parseFloat(raw.market_value) || (currentPrice * qty);
  const unrealizedPnl = parseFloat(raw.unrealized_pnl) || 0;
  const unrealizedPnlPct = parseFloat(raw.unrealized_pnl_pct) || 0;
  const hasLivePrice = raw.has_live_price === true;

  // Mode: from API field, or derive from multiple fallback fields
  let mode = raw.mode || raw.account_type || raw.source;
  if (!mode) {
    // Check bot name for paper indicator
    const botName = (raw.bot_name || '').toLowerCase();
    mode = botName.includes('paper') ? 'paper' : 'live';
  }
  // Normalize to 'live' or 'paper'
  mode = (mode || '').toLowerCase().includes('paper') ? 'paper' : 'live';

  // Venue: from API field or derive from bot name
  const venue = raw.venue || (
    (raw.bot_name || '').includes('UNIFIED') ? 'kraken' :
    (raw.bot_name || '').includes('EQUITY') ? 'schwab' : 'unknown'
  );

  // Date normalization: try multiple fields
  const rawDate = raw.entry_time || raw.opened_at || raw.timestamp || raw.signal_time || raw.created_at || null;

  // Quote timestamp for staleness check
  const quoteTimestamp = raw.quote_timestamp || null;

  // Determine stale reason
  let staleReason = null;
  if (!hasLivePrice) {
    if (currentPrice === 0 || currentPrice === entryPrice) {
      staleReason = 'No mark';
    } else {
      staleReason = 'Stale';
    }
  } else if (quoteTimestamp) {
    const quoteAge = getQuoteAgeMinutes(quoteTimestamp);
    if (quoteAge > 15) {
      staleReason = `${Math.round(quoteAge)}m old`;
    }
  }

  return {
    symbol: raw.symbol || 'UNK',
    qty,
    side: raw.side || 'long',
    entryPrice,
    currentPrice,
    unrealizedPnl,
    unrealizedPnlPct,
    marketValue,
    botName: raw.bot_name || 'UNKNOWN',
    // Date fields
    entryTime: rawDate,
    dateDisplay: formatDateTime(rawDate),
    dateShort: formatDateShort(rawDate),
    // Price timestamp
    quoteTimestamp,
    quoteTimeDisplay: quoteTimestamp ? formatRelativeTime(quoteTimestamp) : null,
    // Trade params
    stopLoss: raw.stop_loss || null,
    takeProfit: raw.take_profit || null,
    // V4 fields
    mode,
    venue,
    signalName: raw.signal_name || null,
    tier: raw.tier || null,
    positionId: raw.position_id || null,
    sizeUsd: parseFloat(raw.size_usd) || null,
    hasLivePrice,
    staleReason,
    // Derived fields
    isLive: mode === 'live',
    isPaper: mode === 'paper',
    isCrypto: venue === 'kraken' || (raw.bot_name || '').includes('UNIFIED'),
    isEquity: venue === 'schwab' || (raw.bot_name || '').includes('EQUITY'),
    // Flag for stale prices
    isStalePrice: !hasLivePrice || staleReason !== null,
  };
}

// Calculate quote age in minutes
function getQuoteAgeMinutes(isoString) {
  if (!isoString) return Infinity;
  try {
    const date = new Date(isoString);
    const now = new Date();
    return (now - date) / 60000;
  } catch {
    return Infinity;
  }
}

// Format date in short form for table rows
function formatDateShort(isoString) {
  if (!isoString) return '--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      // If parsing failed, return raw string if it looks useful
      if (typeof isoString === 'string' && isoString.length > 0 && isoString.length < 20) {
        return isoString;
      }
      return '--';
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();

    // If today, show time
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      const hours = date.getHours();
      const mins = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${mins} ${ampm}`;
    }

    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    // Otherwise show date
    return `${month} ${day}`;
  } catch {
    return '--';
  }
}

// Normalize header stats from daily_pnl
export function normalizeHeaderStats(dailyPnl, bots, btcRegime) {
  return {
    accountValue: parseFloat(dailyPnl?.equity) || 0,
    cash: parseFloat(dailyPnl?.cash) || 0,
    dailyPnl: parseFloat(dailyPnl?.daily_pnl) || 0,
    dailyPnlPct: parseFloat(dailyPnl?.daily_pnl_pct) || 0,
    positionsValue: parseFloat(dailyPnl?.positions_value) || 0,
    btcRegime: btcRegime || 'UNKNOWN',
    runningBots: (bots || []).filter(b => normalizeBotStatus(b.status) === 'running').length,
    totalBots: (bots || []).length,
  };
}

// Normalize trade log event
export function normalizeTradeEvent(raw) {
  return {
    timestamp: raw.timestamp || new Date().toISOString(),
    type: raw.action || raw.type || 'unknown',
    symbol: raw.symbol || '',
    botName: raw.bot_name || raw.bot || '',
    side: raw.side || 'long',
    qty: parseFloat(raw.qty) || 0,
    price: parseFloat(raw.price) || 0,
    pnl: raw.pnl != null ? parseFloat(raw.pnl) : null,
    reason: raw.reason || null,
  };
}

// Status chip colors
export const STATUS_COLORS = {
  running: 'bg-green-500/20 text-green-400 border-green-500/30',
  stopped: 'bg-red-500/20 text-red-400 border-red-500/30',
  error: 'bg-red-500/30 text-red-400 border-red-500/50',
  unknown: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  paper: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  idle: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  monitor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

// Format currency
export function formatCurrency(value, decimals = 2) {
  if (value == null || isNaN(value)) return '--';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format percent with sign
export function formatPercent(value, decimals = 2) {
  if (value == null || isNaN(value)) return '--';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

// Format relative time
export function formatRelativeTime(isoString) {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return null;
  }
}

// Format uptime
export function formatUptime(seconds) {
  if (!seconds) return '--';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${mins}m`;
}

// Format date in compact mobile-friendly way
export function formatDate(isoString) {
  if (!isoString) return '--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();

    // If today or yesterday, show relative
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    // Otherwise show date
    return `${month} ${day}`;
  } catch {
    return '--';
  }
}

// Format date with time
export function formatDateTime(isoString) {
  if (!isoString) return '--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours();
    const mins = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    return `${month} ${day}, ${hour12}:${mins} ${ampm}`;
  } catch {
    return '--';
  }
}
