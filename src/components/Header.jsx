import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useTextSize } from '../context/TextSizeContext';

function TextSizeToggle() {
  const { textSize, setTextSize, TEXT_SIZES } = useTextSize();
  const sizes = Object.keys(TEXT_SIZES);

  return (
    <div className="flex items-center gap-0.5 bg-slate-700 rounded px-1.5 py-1">
      <span className="text-xs text-slate-400 mr-1">Aa</span>
      {sizes.map((size) => (
        <button
          key={size}
          onClick={() => setTextSize(size)}
          className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
            textSize === size
              ? 'bg-cyan-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {TEXT_SIZES[size].label}
        </button>
      ))}
    </div>
  );
}

const TABS = [
  { id: 'desk', label: 'Live Desk', icon: '📡' },
  { id: 'bots', label: 'Bots', icon: '🤖' },
  { id: 'spx', label: 'SPX Fleet', icon: '🎯' },
  { id: 'live', label: 'Live Monitor', icon: '📺' },
  { id: 'trades', label: 'Trades', icon: '📈' },
  { id: 'backtest', label: 'Backtest', icon: '🧪' },
  { id: 'research', label: 'Research', icon: '🔬' },
  { id: 'compare', label: 'Compare', icon: '⚖️' },
  { id: 'rankings', label: 'Rankings', icon: '🏆' },
  { id: 'validate', label: 'Validate', icon: '✅' },
  { id: 'lab', label: 'Strategy Lab', icon: '📌' },
  { id: 'ppo', label: 'PPO Lab', icon: '🧠' },
  { id: 'postmortem', label: 'Postmortem', icon: '📊' },
];

export function Header({ isConnected, dailyPnl, activeTab, onTabChange, marketClock, onRefresh }) {
  const api = useApi();
  const [time, setTime] = useState(new Date());
  const [goLiveStatus, setGoLiveStatus] = useState({ bug_free_days: 0 });
  const [unrealizedPnl, setUnrealizedPnl] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    // Also refresh local data
    try {
      const data = await api.fetchApi('/api/positions/live');
      setUnrealizedPnl(data?.total_unrealized || 0);
      const goLiveData = await api.fetchApi('/api/golive/status');
      setGoLiveStatus(goLiveData);
    } catch (e) {
      console.error('Refresh failed:', e);
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch unrealized P&L from live positions
  useEffect(() => {
    const fetchUnrealized = async () => {
      try {
        const data = await api.fetchApi('/api/positions/live');
        setUnrealizedPnl(data?.total_unrealized || 0);
      } catch (e) {
        console.error('Failed to fetch unrealized P&L:', e);
      }
    };
    fetchUnrealized();
    const interval = setInterval(fetchUnrealized, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch go-live status
  useEffect(() => {
    const fetchGoLive = async () => {
      try {
        const data = await api.fetchApi('/api/golive/status');
        setGoLiveStatus(data);
      } catch (e) {
        console.error('Failed to fetch go-live status:', e);
      }
    };
    fetchGoLive();
    const interval = setInterval(fetchGoLive, 60000);
    return () => clearInterval(interval);
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
            {/* Text Size Toggle */}
            <TextSizeToggle />

            {/* Clock + Refresh */}
            <div className="flex items-center gap-2">
              <div className="text-slate-300 font-mono">
                {etTime} ET
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-1.5 rounded hover:bg-slate-600 transition-colors ${
                  isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
                title="Refresh data"
              >
                🔄
              </button>
            </div>

            {/* Market Status */}
            <div className={`px-2 py-1 rounded ${statusDisplay.bg} ${statusDisplay.color}`}>
              {statusDisplay.text}
            </div>

            {/* Trading Day */}
            <div className="text-slate-500">
              {isTradingDay ? 'Trading Day' : 'Weekend'}
            </div>

            {/* Go-Live Mini Tracker */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 rounded cursor-pointer hover:bg-slate-600 transition-colors"
              onClick={() => onTabChange('spx')}
            >
              <span className="text-xs text-slate-400">SPX_F:</span>
              <div className="flex items-center gap-0.5">
                {[...Array(14)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-3 rounded-sm ${
                      i < goLiveStatus.bug_free_days ? 'bg-green-500' : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
              <span className={`font-mono text-xs font-bold ${
                goLiveStatus.bug_free_days >= 14 ? 'text-green-400' :
                goLiveStatus.bug_free_days >= 7 ? 'text-yellow-400' : 'text-slate-300'
              }`}>
                {goLiveStatus.bug_free_days}/14
              </span>
              {goLiveStatus.bug_free_days >= 14 && <span className="text-sm">🚀</span>}
            </div>
          </div>

          {/* Shadow P&L (Paper Trading) */}
          <div className="text-right flex items-center gap-3">
            <div className="px-2 py-1 bg-purple-500/20 rounded">
              <span className="text-purple-400 text-xs font-medium">SHADOW </span>
              <span className={`font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="px-2 py-1 bg-slate-700/50 rounded">
              <span className="text-slate-500 text-xs">Open: </span>
              <span className={`font-mono font-bold ${unrealizedPnl >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
                {unrealizedPnl >= 0 ? '+' : ''}${Math.abs(unrealizedPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Market Info */}
        <div className="md:hidden flex items-center justify-between text-xs mb-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-mono">{etTime} ET</span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-1 rounded ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`}
            >
              🔄
            </button>
          </div>
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
