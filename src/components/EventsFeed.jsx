export function EventsFeed({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 text-center">
        <div className="text-slate-400 text-sm">No recent trades</div>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return '--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'entry':
      case 'buy':
        return 'bg-blue-500/20 text-blue-400';
      case 'exit':
      case 'sell':
        return 'bg-purple-500/20 text-purple-400';
      case 'stop_hit':
      case 'stop':
        return 'bg-red-500/20 text-red-400';
      case 'target_hit':
      case 'target':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50">
        <h3 className="font-medium text-white">Recent Trades</h3>
      </div>
      <div className="divide-y divide-slate-700/30 max-h-[400px] overflow-y-auto">
        {events.map((event, idx) => {
          const pnl = event.pnl;
          const hasPnl = pnl !== null && pnl !== undefined;
          const isPnlPositive = pnl >= 0;

          return (
            <div
              key={idx}
              className="px-4 py-3 hover:bg-slate-700/20 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${getActionColor(event.action)}`}>
                    {event.action?.toUpperCase()}
                  </span>
                  <span className="font-mono font-bold text-white">{event.symbol}</span>
                  <span className="text-slate-400 text-sm">
                    {event.qty}@${event.price?.toFixed(2)}
                  </span>
                </div>

                {hasPnl && (
                  <span className={`font-mono font-medium whitespace-nowrap ${
                    isPnlPositive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isPnlPositive ? '+' : ''}${pnl.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-500">{event.bot_name}</span>
                <span className="text-xs text-slate-500 font-mono">
                  {formatTime(event.timestamp)}
                </span>
              </div>

              {event.reason && (
                <div className="text-xs text-slate-500 mt-1 italic">
                  {event.reason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
