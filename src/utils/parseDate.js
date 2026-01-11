// Parse various date formats from the trading system
export function parseTradeDate(dateString) {
  if (!dateString) return null;

  // Remove ET/PT timezone suffix and parse
  // Input: '2026-01-06 15:55:32 ET' or '2026-01-06T15:55:32Z'

  let cleaned = String(dateString);

  // Remove timezone abbreviations
  cleaned = cleaned.replace(/ ET$/, '');
  cleaned = cleaned.replace(/ PT$/, '');
  cleaned = cleaned.replace(/ EST$/, '');
  cleaned = cleaned.replace(/ EDT$/, '');

  // Replace space with T if needed for ISO format
  if (cleaned.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)) {
    cleaned = cleaned.replace(' ', 'T');
  }

  const date = new Date(cleaned);

  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatTradeDate(dateString) {
  const date = parseTradeDate(dateString);
  if (!date) return '--';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export function formatTradeTime(dateString) {
  const date = parseTradeDate(dateString);
  if (!date) return '--';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatTradeDateTime(dateString) {
  const date = parseTradeDate(dateString);
  if (!date) return '--';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
