import { formatCurrency, formatPercent } from '../../types/v4Types';
import { LiveDot, BtcRegimeBadge } from './StatusChip';

/**
 * V4 Header stats bar
 */
export function HeaderStatsBar({
  accountValue,
  dailyPnl,
  dailyPnlPct,
  btcRegime,
  runningBots,
  totalBots,
  isConnected,
  onRefresh,
}) {
  const isPositive = dailyPnl >= 0;

  return (
    <div className="bg-slate-800 border-b border-slate-700">
      {/* Top row - Title and LIVE indicator */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white">Thaovogue Swarm V4</h1>
          <div className="flex items-center gap-1.5">
            <LiveDot isLive={isConnected && runningBots > 0} />
            <span className={`text-xs font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
          title="Refresh"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Stats row */}
      <div className="px-4 py-2 flex items-center gap-4 overflow-x-auto text-sm">
        {/* Account Value */}
        <div className="flex-shrink-0">
          <div className="text-xs text-slate-500">Account</div>
          <div className="font-mono font-bold text-white">
            {formatCurrency(accountValue, 0)}
          </div>
        </div>

        <div className="w-px h-8 bg-slate-700" />

        {/* Daily P&L */}
        <div className="flex-shrink-0">
          <div className="text-xs text-slate-500">Today</div>
          <div className={`font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{formatCurrency(dailyPnl, 0)}
            <span className="text-xs ml-1 opacity-70">{formatPercent(dailyPnlPct)}</span>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-700" />

        {/* BTC Regime */}
        <div className="flex-shrink-0">
          <BtcRegimeBadge regime={btcRegime} />
        </div>

        <div className="w-px h-8 bg-slate-700 hidden sm:block" />

        {/* Bots */}
        <div className="flex-shrink-0 hidden sm:block">
          <div className="text-xs text-slate-500">Bots</div>
          <div className="font-mono">
            <span className="text-green-400">{runningBots}</span>
            <span className="text-slate-500">/{totalBots}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tab navigation
 */
export function TabNavigation({ activeTab, onTabChange, tabs }) {
  return (
    <div className="bg-slate-800/50 border-b border-slate-700 overflow-x-auto">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
