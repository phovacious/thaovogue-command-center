export function BotGrid({ bots = [], onBotClick }) {
  const runningCount = bots.filter(b => b.status === 'running' || b.status === 'RUNNING' || b.status === 'ACTIVE').length;

  const formatUptime = (seconds) => {
    if (!seconds) return '--';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Bot Fleet</h3>
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-mono font-bold">{runningCount}</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-400 font-mono">{bots.length}</span>
          <span className="text-slate-500 text-sm">running</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {bots.map((bot) => {
          const isRunning = bot.status === 'running' || bot.status === 'RUNNING' || bot.status === 'ACTIVE';

          return (
            <div
              key={bot.name || bot.id}
              onClick={() => onBotClick && onBotClick(bot)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isRunning
                  ? 'bg-slate-800/70 border-green-500/30 hover:border-cyan-500/50 hover:bg-slate-800 hover:ring-1 hover:ring-cyan-500/30'
                  : 'bg-slate-800/30 border-slate-700/50 opacity-60 hover:opacity-80 hover:border-slate-600'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  isRunning ? 'bg-green-400 pulse-green' : 'bg-slate-500'
                }`} />
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  isRunning
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-600/50 text-slate-400'
                }`}>
                  {isRunning ? 'RUNNING' : 'STOPPED'}
                </span>
              </div>

              {/* Name */}
              <div className="font-medium text-white text-sm mb-1 truncate">
                {(bot.name || bot.id || '').replace('BOT_', '')}
              </div>

              {/* Symbols */}
              <div className="text-xs text-slate-400 mb-2 truncate">
                {bot.symbols?.slice(0, 3).join(', ')}
                {bot.symbols?.length > 3 && ` +${bot.symbols.length - 3}`}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Uptime:</span>
                <span className="font-mono text-slate-300">
                  {formatUptime(bot.uptime_seconds)}
                </span>
              </div>

              {bot.pid && (
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-slate-500">PID:</span>
                  <span className="font-mono text-slate-400">{bot.pid}</span>
                </div>
              )}

              {/* Click hint */}
              <div className="text-xs text-slate-600 mt-2 text-center">
                Click for trades
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
