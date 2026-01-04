import { useState, useEffect } from 'react';

const TABS = [
  { id: 'desk', label: 'Live Desk', icon: '📡' },
  { id: 'bots', label: 'Bots', icon: '🤖' },
  { id: 'trades', label: 'Trades', icon: '📈' },
  { id: 'backtest', label: 'Backtest', icon: '🧪' },
  { id: 'lab', label: 'Strategy Lab', icon: '📌' },
  { id: 'postmortem', label: 'Postmortem', icon: '📊' },
];

export function Header({ isConnected, dailyPnl, activeTab, onTabChange, marketClock }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const etTime = time.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const pnl = dailyPnl?.daily_pnl || 0;
  const pnlPct = dailyPnl?.daily_pnl_pct || 0;
  const isPositive = pnl >= 0;

  const status = marketClock?.status || 'CLOSED';
  const isMarketOpen = marketClock?.is_market_open || false;
  const isTradingDay = marketClock?.is_trading_day || false;

  const getStatusDisplay = () => {
    switch (status) {
      case 'OPEN': return { text: 'Market Open', color: 'text-green-400', bg: 'bg-green-500/20' };
      case 'PRE-MARKET': return { text: 'Pre-Market', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      case 'AFTER-HOURS': return { text: 'After Hours', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      default: return { text: 'Closed', color: 'text-red-400', bg: 'bg-red-500/20' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-3">
          {/* Logo + Connection Status */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">Thaovogue</h1>
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isConnected ? '🟢 LIVE' : '🔴 OFFLINE'}
            </span>
          </div>

          {/* Market Info */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            {/* Clock */}
            <div className="text-slate-300 font-mono">
              {etTime} ET
            </div>

            {/* Market Status */}
            <div className={`px-2 py-1 rounded ${statusDisplay.bg} ${statusDisplay.color}`}>
              {statusDisplay.text}
            </div>

            {/* Trading Day */}
            <div className="text-slate-500">
              {isTradingDay ? 'Trading Day' : 'Weekend'}
            </div>
          </div>

          {/* Daily P&L */}
          <div className="text-right">
            <span className="text-slate-500 text-sm hidden sm:inline">Daily: </span>
            <span className={`font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`ml-1 text-sm ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
              ({isPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Mobile Market Info */}
        <div className="md:hidden flex items-center justify-between text-xs mb-3">
          <span className="text-slate-300 font-mono">{etTime} ET</span>
          <span className={`px-2 py-0.5 rounded ${statusDisplay.bg} ${statusDisplay.color}`}>
            {statusDisplay.text}
          </span>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 -mb-px overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
