import { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useApi } from './hooks/useApi';
import { Header } from './components/Header';
import { LiveDesk } from './components/LiveDesk';
import { CryptoTab } from './components/CryptoTab';
import { EquityTab } from './components/EquityTab';
import { ValueTab } from './components/ValueTab';
import { ThemesTab } from './components/ThemesTab';

function App() {
  const [activeTab, setActiveTab] = useState('live');
  const { isConnected, deskData, refresh: refreshWebSocket } = useWebSocket();
  const api = useApi();
  const [marketClock, setMarketClock] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const appVersionRaw = import.meta.env.VITE_APP_VERSION || 'dev';
  const appVersion = appVersionRaw === 'dev' ? 'dev' : appVersionRaw.slice(0, 7);
  const buildTime = import.meta.env.VITE_BUILD_TIME || 'dev';

  // Global refresh function
  const handleGlobalRefresh = async () => {
    if (refreshWebSocket) {
      refreshWebSocket();
    }
    try {
      const clockData = await api.fetchApi('/api/market/clock');
      setMarketClock(clockData);
    } catch (e) {
      console.error('Refresh failed:', e);
    }
    setRefreshKey(k => k + 1);
  };

  // Fetch market clock every 30 seconds
  useEffect(() => {
    const fetchClock = async () => {
      try {
        const data = await api.fetchApi('/api/market/clock');
        setMarketClock(data);
      } catch (e) {
        console.error('Failed to fetch market clock:', e);
      }
    };

    fetchClock();
    const interval = setInterval(fetchClock, 30000);
    return () => clearInterval(interval);
  }, []);

  // Force refresh on window focus (native app feel)
  useEffect(() => {
    const handleFocus = () => {
      console.log('[App] Window focused - refreshing data');
      handleGlobalRefresh();
    };

    window.addEventListener('focus', handleFocus);
    // Also refresh on visibility change (tab switch)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleGlobalRefresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      <Header
        isConnected={isConnected}
        dailyPnl={deskData?.daily_pnl}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        marketClock={marketClock}
        onRefresh={handleGlobalRefresh}
      />

      <main className="max-w-7xl mx-auto py-4">
        <div key={activeTab} className="tab-content">
          {activeTab === 'live' && (
            <LiveDesk deskData={deskData} />
          )}

          {activeTab === 'crypto' && (
            <CryptoTab key={refreshKey} />
          )}

          {activeTab === 'equity' && (
            <EquityTab key={refreshKey} />
          )}

          {activeTab === 'value' && (
            <ValueTab key={refreshKey} />
          )}

          {activeTab === 'themes' && (
            <ThemesTab key={refreshKey} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-500 text-sm relative">
        <div>Thaovogue Swarm v4.3.0</div>
        <div className="text-xs mt-1">
          {isConnected ? (
            <span className="text-green-400">Connected</span>
          ) : (
            <span className="text-red-400">Reconnecting...</span>
          )}
          {marketClock && (
            <span className="ml-2 text-slate-600">• {marketClock.status}</span>
          )}
        </div>
        <div className="absolute right-4 bottom-3 text-xs text-slate-600">
          {appVersion} • {buildTime}
        </div>
      </footer>
    </div>
  );
}

export default App;
