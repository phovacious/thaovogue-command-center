import { StatusChip, LiveDot } from './StatusChip';
import { formatUptime } from '../../types/v4Types';

/**
 * Bot health card showing status, PID, uptime
 */
export function BotHealthCard({ bot, onClick }) {
  const isRunning = bot.status === 'running';

  return (
    <div
      onClick={() => onClick && onClick(bot)}
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        isRunning
          ? 'bg-slate-800/70 border-green-500/30 hover:border-cyan-500/50'
          : 'bg-slate-800/30 border-slate-700/50 opacity-70 hover:opacity-90'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LiveDot isLive={isRunning} />
          <span className="font-medium text-white">{formatBotName(bot.name)}</span>
        </div>
        <StatusChip status={bot.status} size="xs" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-slate-500">Uptime</div>
          <div className="font-mono text-slate-300">{formatUptime(bot.uptime)}</div>
        </div>
        <div>
          <div className="text-slate-500">PID</div>
          <div className="font-mono text-slate-300">{bot.pid || '--'}</div>
        </div>
        <div className="col-span-2">
          <div className="text-slate-500">Symbols</div>
          <div className="text-slate-400 truncate">
            {bot.symbols?.slice(0, 4).join(', ')}
            {bot.symbols?.length > 4 && ` +${bot.symbols.length - 4}`}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact bot row for list view
 */
export function BotHealthRow({ bot }) {
  const isRunning = bot.status === 'running';

  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${
      isRunning ? 'bg-slate-800/50' : 'bg-slate-800/20 opacity-60'
    }`}>
      <div className="flex items-center gap-3">
        <LiveDot isLive={isRunning} size="xs" />
        <span className="font-medium text-white text-sm">{formatBotName(bot.name)}</span>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className="text-slate-400 font-mono hidden sm:inline">
          {formatUptime(bot.uptime)}
        </span>
        <StatusChip status={bot.status} size="xs" />
      </div>
    </div>
  );
}

/**
 * Grid of bot health cards
 */
export function BotHealthGrid({ bots = [], onBotClick }) {
  const running = bots.filter(b => b.status === 'running').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Bot Health</h3>
        <div className="text-sm">
          <span className="text-green-400 font-mono">{running}</span>
          <span className="text-slate-500">/{bots.length} running</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {bots.map((bot) => (
          <BotHealthCard key={bot.name} bot={bot} onClick={onBotClick} />
        ))}
      </div>
    </div>
  );
}

// Format bot name for display
function formatBotName(name) {
  if (!name) return 'Unknown';
  return name
    .replace('V4_', '')
    .replace('_', ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
