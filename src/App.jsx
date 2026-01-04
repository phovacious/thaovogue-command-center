import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { Header } from './components/Header';
import { LiveDesk } from './components/LiveDesk';
import { BotGrid } from './components/BotGrid';
import { BacktestPanel } from './components/BacktestPanel';

function App() {
  const [activeTab, setActiveTab] = useState('desk');
  const { isConnected, deskData } = useWebSocket();

  return (
    <div className="min-h-screen bg-slate-900">
      <Header
        isConnected={isConnected}
        dailyPnl={deskData?.daily_pnl}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'desk' && (
          <LiveDesk deskData={deskData} />
        )}

        {activeTab === 'bots' && (
          <div className="space-y-6">
            <BotGrid bots={deskData?.bots || []} />
          </div>
        )}

        {activeTab === 'backtest' && (
          <BacktestPanel />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-500 text-sm">
        <div>Thaovogue Command Center v3.4</div>
        <div className="text-xs mt-1">
          {isConnected ? (
            <span className="text-green-400">Connected to WebSocket</span>
          ) : (
            <span className="text-red-400">Connecting...</span>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;
