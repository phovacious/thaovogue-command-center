import { useState } from 'react';

export function Header({ isConnected, dailyPnl, activeTab, onTabChange }) {
  const tabs = [
    { id: 'desk', label: 'Live Desk' },
    { id: 'bots', label: 'Bots' },
    { id: 'backtest', label: 'Backtest' },
  ];

  const pnl = dailyPnl?.daily_pnl || 0;
  const pnlPct = dailyPnl?.daily_pnl_pct || 0;
  const isPositive = pnl >= 0;

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-bold text-white">
              Thaovogue
            </h1>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
              isConnected
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400 pulse-green' : 'bg-red-400'
              }`} />
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>

          {/* Daily P&L */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-slate-400 text-sm">Daily:</span>
            <span className={`font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </span>
            <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              ({isPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 mt-3 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
