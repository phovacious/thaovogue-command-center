import { useState, useEffect, lazy, Suspense } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useApi } from './hooks/useApi';
import { Header } from './components/Header';
import { LiveDesk } from './components/LiveDesk';

// Lazy-load non-default tabs for faster initial paint
const CryptoTab = lazy(() => import('./components/CryptoTab').then(m => ({ default: m.CryptoTab })));
const EquityTab = lazy(() => import('./components/EquityTab').then(m => ({ default: m.EquityTab })));
const ValueTab = lazy(() => import('./components/ValueTab').then(m => ({ default: m.ValueTab })));
const ThemesTab = lazy(() => import('./components/ThemesTab').then(m => ({ default: m.ThemesTab })));

// Lightweight loading skeleton for lazy tabs
function TabSkeleton() {
  return (
    <div className="px-4 py-8 animate-pulse">
      <div className="h-8 bg-slate-700 rounded w-48 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('live');
  const { isConnected, deskData, refresh: refreshWebSocket } = useWebSocket();
  const api = useApi();
  const [marketClock, setMarketClock] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastVpsSync, setLastVpsSync] = useState(null);
  const appVersionRaw = import.meta.env.VITE_APP_VERSION || 'dev';
  const appVersion = appVersionRaw === 'dev' ? 'dev' : appVersionRaw.slice(0, 7);
  const buildTime = import.meta.env.VITE_BUILD_TIME || 'dev';

  // Perf: measure startup to first render (dev only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      performance.mark('app_first_render');
      performance.measure('startup_to_first_render', 'app_start', 'app_first_render');
      const m = performance.getEntriesByName('startup_to_first_render').pop();
      console.log('[perf] startup_to_first_render(ms)=', m?.duration?.toFixed(1));
    }
  }, []);

  // Format relative time for VPS sync
  const formatSyncTime = (isoString) => {
    if (!isoString) return null;
    try {
      const syncDate = new Date(isoString);
      const now = new Date();
      const diffMs = now - syncDate;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return syncDate.toLocaleDateString();
    } catch {
      return null;
    }
  };

  // Global refresh function
  const handleGlobalRefresh = async () => {
    if (refreshWebSocket) {
      refreshWebSocket();
    }
    try {
      const [clockData, valuesData] = await Promise.allSettled([
        api.fetchApi('/api/market/clock'),
        api.fetchApi('/api/values-tab')
      ]);
      if (clockData.status === 'fulfilled') setMarketClock(clockData.value);
      if (valuesData.status === 'fulfilled') setLastVpsSync(valuesData.value?.last_vps_sync);
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
        {/* Keep all tabs mounted, toggle visibility via CSS for instant switching */}
        {/* Lazy tabs wrapped in Suspense for code-splitting */}
        <div className="tab-content">
          <div className={activeTab === 'live' ? 'block' : 'hidden'}>
            <LiveDesk deskData={deskData} />
          </div>

          <div className={activeTab === 'crypto' ? 'block' : 'hidden'}>
            <Suspense fallback={<TabSkeleton />}>
              <CryptoTab />
            </Suspense>
          </div>

          <div className={activeTab === 'equity' ? 'block' : 'hidden'}>
            <Suspense fallback={<TabSkeleton />}>
              <EquityTab />
            </Suspense>
          </div>

          <div className={activeTab === 'value' ? 'block' : 'hidden'}>
            <Suspense fallback={<TabSkeleton />}>
              <ValueTab />
            </Suspense>
          </div>

          <div className={activeTab === 'themes' ? 'block' : 'hidden'}>
            <Suspense fallback={<TabSkeleton />}>
              <ThemesTab />
            </Suspense>
          </div>
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
          {lastVpsSync && (
            <span className="ml-2 text-cyan-500">• VPS: {formatSyncTime(lastVpsSync)}</span>
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
