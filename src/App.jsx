import { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useApi } from './hooks/useApi';
import { Header } from './components/Header';
import { LiveDesk } from './components/LiveDesk';
import { BotGrid } from './components/BotGrid';
import { BotDetailModal } from './components/BotDetailModal';
import { BacktestPanel } from './components/BacktestPanel';
import { TradesTab } from './components/TradesTab';
import { PostmortemTab } from './components/PostmortemTab';
import { StrategyLabTab } from './components/StrategyLabTab';
import { SPXFleetTab } from './components/SPXFleetTab';
import { PPOLabTab } from './components/PPOLabTab';

function App() {
  const [activeTab, setActiveTab] = useState('desk');
  const { isConnected, deskData } = useWebSocket();
  const api = useApi();
  const [marketClock, setMarketClock] = useState(null);
  const [bots, setBots] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);

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

  // Fetch bots list once
  useEffect(() => {
    const fetchBots = async () => {
      try {
        const data = await api.fetchApi('/api/bots/list');
        setBots(data.bots || []);
      } catch (e) {
        console.error('Failed to fetch bots:', e);
      }
    };
    fetchBots();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      <Header
        isConnected={isConnected}
        dailyPnl={deskData?.daily_pnl}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        marketClock={marketClock}
      />

      <main className="max-w-7xl mx-auto py-4">
        {activeTab === 'desk' && (
          <LiveDesk deskData={deskData} onBotClick={setSelectedBot} />
        )}

        {activeTab === 'bots' && (
          <div className="px-4">
            <BotGrid bots={deskData?.bots || []} onBotClick={setSelectedBot} />
          </div>
        )}

        {activeTab === 'spx' && (
          <SPXFleetTab />
        )}

        {activeTab === 'trades' && (
          <TradesTab bots={bots} />
        )}

        {activeTab === 'backtest' && (
          <BacktestPanel />
        )}

        {activeTab === 'lab' && (
          <StrategyLabTab />
        )}

        {activeTab === 'ppo' && (
          <PPOLabTab />
        )}

        {activeTab === 'postmortem' && (
          <PostmortemTab />
        )}
      </main>

      {/* Bot Detail Modal */}
      {selectedBot && (
        <BotDetailModal bot={selectedBot} onClose={() => setSelectedBot(null)} />
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-slate-500 text-sm">
        <div>Thaovogue Command Center v3.6.4</div>
        <div className="text-xs mt-1">
          {isConnected ? (
            <span className="text-green-400">Connected</span>
          ) : (
            <span className="text-red-400">Reconnecting...</span>
          )}
          {marketClock && (
            <span className="ml-2 text-slate-600">• {marketClock.status}</span>
          )}
          <span className="ml-2 text-slate-600">• Build: 20260104-1800</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
