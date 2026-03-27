import { useState, useEffect, useRef } from 'react';
import { useApi } from '../../hooks/useApi';
import { normalizePosition, normalizeBot, normalizeHeaderStats, normalizeTradeEvent } from '../../types/v4Types';
import { HeaderStatsBar, TabNavigation } from './HeaderStatsBar';
import { PositionsTable } from './PositionsTable';
import { BotHealthGrid } from './BotHealthCard';
import { TradeLogFeed } from './TradeLogFeed';
import { FleetStatusSection } from './FleetGrid';
import { SectionCard, LoadingSkeleton, DataRefreshIndicator, EmptyState } from './EmptyState';
import { StatusChip } from './StatusChip';

const TABS = [
  { id: 'positions', label: 'Positions', icon: '📊' },
  { id: 'paper', label: 'Paper', icon: '📝' },
  { id: 'fleet', label: 'Fleet', icon: '🚀' },
  { id: 'health', label: 'Health', icon: '💓' },
  { id: 'log', label: 'Log', icon: '📋' },
];

const POLL_INTERVAL = 5000; // 5 seconds

export function V4Dashboard() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('positions');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Data state
  const [positions, setPositions] = useState([]);
  const [bots, setBots] = useState([]);
  const [dailyPnl, setDailyPnl] = useState({});
  const [events, setEvents] = useState([]);
  const [btcRegime, setBtcRegime] = useState('UNKNOWN');

  const pollRef = useRef(null);

  // Fetch all data
  const fetchData = async () => {
    try {
      setError(null);

      const [snapshotRes, botsRes, pnlRes] = await Promise.allSettled([
        api.fetchApi('/api/desk/snapshot'),
        api.fetchApi('/api/desk/bots'),
        api.fetchApi('/api/desk/pnl'),
      ]);

      // Process snapshot (positions)
      if (snapshotRes.status === 'fulfilled' && snapshotRes.value) {
        const rawPositions = snapshotRes.value.positions || [];
        setPositions(rawPositions.map(normalizePosition));

        // Extract BTC regime if present
        if (snapshotRes.value.btc_regime) {
          setBtcRegime(snapshotRes.value.btc_regime);
        }

        // Extract events if present
        if (snapshotRes.value.events) {
          setEvents(snapshotRes.value.events.map(normalizeTradeEvent));
        }
      }

      // Process bots
      if (botsRes.status === 'fulfilled' && botsRes.value) {
        const rawBots = botsRes.value.bots || [];
        setBots(rawBots.map(normalizeBot));
      }

      // Process daily P&L
      if (pnlRes.status === 'fulfilled' && pnlRes.value) {
        setDailyPnl(pnlRes.value);
      }

      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchData();

    pollRef.current = setInterval(fetchData, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  // Derived data
  const livePositions = positions.filter(p => p.isLive || p.isCrypto);
  const paperPositions = positions.filter(p => p.isPaper && !p.isCrypto);
  const cryptoPositions = positions.filter(p => p.isCrypto);
  const equityPositions = positions.filter(p => p.isEquity);
  const liveCrypto = cryptoPositions.filter(p => p.isLive);
  const paperCrypto = cryptoPositions.filter(p => p.isPaper);
  const liveEquity = equityPositions.filter(p => p.isLive);
  const paperEquity = equityPositions.filter(p => p.isPaper);

  const headerStats = normalizeHeaderStats(dailyPnl, bots, btcRegime);
  const runningBots = bots.filter(b => b.status === 'running').length;

  // Build fleet data from positions
  const equityFleet = buildFleetFromPositions(equityPositions);
  const cryptoFleet = buildFleetFromPositions(cryptoPositions);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <HeaderStatsBar
        accountValue={headerStats.accountValue}
        dailyPnl={headerStats.dailyPnl}
        dailyPnlPct={headerStats.dailyPnlPct}
        btcRegime={btcRegime}
        runningBots={runningBots}
        totalBots={bots.length}
        isConnected={runningBots > 0}
        onRefresh={fetchData}
      />

      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={TABS}
      />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4 text-red-400">
            Error loading data: {error}
          </div>
        )}

        {/* Tab: Live Positions */}
        {activeTab === 'positions' && (
          <div className="space-y-6">
            <DataRefreshIndicator lastUpdate={lastUpdate} isLoading={isLoading} />

            {/* Crypto Positions */}
            <SectionCard
              title="Crypto Positions"
              subtitle={`${liveCrypto.length} live on Kraken`}
            >
              {isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : (
                <PositionsTable
                  positions={liveCrypto}
                  emptyIcon="🪙"
                  emptyMessage="No live crypto positions"
                />
              )}
            </SectionCard>

            {/* Equity Positions */}
            <SectionCard
              title="Equity Positions"
              subtitle={liveEquity.length > 0 ? `${liveEquity.length} on Schwab` : 'Paper testing phase'}
            >
              {isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : liveEquity.length > 0 ? (
                <PositionsTable positions={liveEquity} />
              ) : (
                <EmptyState
                  icon="📈"
                  title="No live equity positions yet"
                  description="Currently in paper testing phase"
                />
              )}
            </SectionCard>
          </div>
        )}

        {/* Tab: Paper Trades */}
        {activeTab === 'paper' && (
          <div className="space-y-6">
            <DataRefreshIndicator lastUpdate={lastUpdate} isLoading={isLoading} />

            {/* Equity Paper */}
            <SectionCard
              title="Equity Paper Trades"
              subtitle={`${paperEquity.length} positions`}
            >
              {isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : (
                <PositionsTable
                  positions={paperEquity}
                  emptyIcon="📝"
                  emptyMessage="No equity paper trades"
                />
              )}
            </SectionCard>

            {/* Crypto Paper */}
            <SectionCard
              title="Crypto Paper Trades"
              subtitle={`${paperCrypto.length} positions`}
            >
              {isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : (
                <PositionsTable
                  positions={paperCrypto}
                  emptyIcon="🪙"
                  emptyMessage="No crypto paper trades"
                />
              )}
            </SectionCard>

            {/* SPY Options Shadow */}
            <SectionCard
              title="SPY Options Shadow"
              subtitle="Research mode"
              headerRight={<StatusChip status="pending" size="xs" />}
            >
              <div className="text-center py-6 text-slate-400">
                <div className="text-4xl mb-2">📊</div>
                <div className="text-sm">SPY options shadow trading coming soon</div>
                <div className="text-xs text-slate-500 mt-1">WK signal monitoring active</div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Tab: Fleet Status */}
        {activeTab === 'fleet' && (
          <div className="space-y-6">
            <DataRefreshIndicator lastUpdate={lastUpdate} isLoading={isLoading} />

            {isLoading ? (
              <LoadingSkeleton rows={5} />
            ) : (
              <FleetStatusSection
                equityFleet={equityFleet}
                cryptoFleet={cryptoFleet}
              />
            )}
          </div>
        )}

        {/* Tab: Bot Health */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <DataRefreshIndicator lastUpdate={lastUpdate} isLoading={isLoading} />

            {isLoading ? (
              <LoadingSkeleton rows={4} />
            ) : (
              <BotHealthGrid bots={bots} />
            )}
          </div>
        )}

        {/* Tab: Trade Log */}
        {activeTab === 'log' && (
          <div className="space-y-6">
            <DataRefreshIndicator lastUpdate={lastUpdate} isLoading={isLoading} />

            <SectionCard title="Recent Activity">
              {isLoading ? (
                <LoadingSkeleton rows={5} />
              ) : (
                <TradeLogFeed events={events} />
              )}
            </SectionCard>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-500 text-xs">
        <div>Thaovogue Swarm V4</div>
        <div className="mt-1">
          {runningBots > 0 ? (
            <span className="text-green-400">Connected</span>
          ) : (
            <span className="text-slate-500">Connecting...</span>
          )}
          {lastUpdate && (
            <span className="ml-2">• Updated {lastUpdate.toLocaleTimeString()}</span>
          )}
        </div>
      </footer>
    </div>
  );
}

// Helper to build fleet data from positions
function buildFleetFromPositions(positions) {
  const bySymbol = {};

  positions.forEach(pos => {
    const symbol = pos.symbol.split('_')[0]; // Remove slot suffixes
    if (!bySymbol[symbol]) {
      bySymbol[symbol] = {
        ticker: symbol,
        signals: [],
        positions: 0,
        totalValue: 0,
        totalPnl: 0,
      };
    }
    bySymbol[symbol].positions++;
    bySymbol[symbol].totalValue += pos.marketValue || 0;
    bySymbol[symbol].totalPnl += pos.unrealizedPnl || 0;
  });

  return Object.values(bySymbol).map(item => ({
    ticker: item.ticker,
    signals: item.positions > 1 ? `${item.positions} slots` : '1 slot',
    regime: item.totalPnl >= 0 ? 'PROFITABLE' : 'UNDERWATER',
    status: 'active',
    drawdown: item.totalPnl < 0 ? `${((item.totalPnl / item.totalValue) * 100).toFixed(1)}%` : null,
  }));
}

export default V4Dashboard;
