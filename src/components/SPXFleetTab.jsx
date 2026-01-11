import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { UnifiedDetailCard } from './UnifiedDetailCard';

// Crown Jewels - Best performing strategies (case-insensitive)
const CROWN_JEWELS = ['SPX_G'];
const isCrownJewelsBot = (name) => CROWN_JEWELS.some(cj => (name || '').toUpperCase().includes(cj));

function GoLiveTracker({ bugFreeDays, incidents, onCheckin }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">14-Day Bug-Free Countdown</h4>
        <span className={`font-mono font-bold ${
          bugFreeDays >= 14 ? 'text-green-400' : 'text-yellow-400'
        }`}>
          {bugFreeDays}/14 days
        </span>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-1 mb-4">
        {[...Array(14)].map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-3 rounded ${
              i < bugFreeDays ? 'bg-green-500' : 'bg-slate-600'
            }`}
            title={`Day ${i + 1}`}
          />
        ))}
      </div>

      {/* Criteria Checklist */}
      <div className="text-sm mb-4">
        <div className="font-medium text-slate-400 mb-2">Daily Criteria:</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Entry fires at 13:00
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Filters work correctly
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span> No crashes/restarts
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Logs are clean
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      {incidents && incidents.length > 0 && (
        <div className="mt-4">
          <div className="font-medium text-slate-400 mb-2">Recent Incidents:</div>
          <div className="space-y-2">
            {incidents.slice(0, 3).map((incident, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={incident.resolved ? 'text-green-400' : 'text-red-400'}>
                  {incident.resolved ? '✓' : '✗'}
                </span>
                <span className="text-slate-500">{incident.date?.split('T')[0]}</span>
                <span className="text-slate-300">{incident.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {bugFreeDays >= 14 && (
        <div className="mt-4 p-3 bg-green-500/20 rounded text-green-400 text-center font-medium">
          🎉 Ready for Go-Live! All criteria met.
        </div>
      )}

      <button
        onClick={onCheckin}
        className="mt-4 w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
      >
        ✓ Mark Today as Clean
      </button>
    </div>
  );
}

function SPXBotCard({ bot, onClick, isCandidate }) {
  const isCrownJewels = isCrownJewelsBot(bot.name);

  return (
    <div
      className={`bg-slate-800 rounded-lg p-4 cursor-pointer hover:bg-slate-700 transition ${
        isCandidate ? 'ring-2 ring-green-500/50' : ''
      } ${isCrownJewels ? 'ring-2 ring-yellow-500/50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isCrownJewels && <span title="Crown Jewels - Best Performer">👑</span>}
          {isCandidate && !isCrownJewels && <span>🚀</span>}
          <span className="font-bold">{bot.name}</span>
        </div>
        <span className={`w-2 h-2 rounded-full ${
          bot.status === 'RUNNING' ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </div>
      <div className="text-sm text-slate-400 mb-2">{bot.display_name}</div>
      <div className="text-xs text-slate-500 mb-3">{bot.config?.strike_distance}</div>
      <div className="flex justify-between items-center">
        <span className={`px-2 py-1 rounded text-xs ${
          bot.mode === 'LIVE' ? 'bg-green-500/20 text-green-400' :
          bot.mode === 'FORWARD_TESTING' ? 'bg-cyan-500/20 text-cyan-400' :
          bot.mode === 'CONTROL' ? 'bg-amber-500/20 text-amber-400' :
          'bg-slate-600 text-slate-300'
        }`} title={bot.mode === 'CONTROL' ? 'Diagnostic bot - not eligible for live capital' : ''}>
          {bot.mode === 'CONTROL' ? '🐤 CONTROL' : bot.mode}
        </span>
        <span className={`font-mono text-sm ${bot.month_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {bot.month_pnl >= 0 ? '+' : ''}${bot.month_pnl?.toFixed(0) || 0}
        </span>
      </div>
    </div>
  );
}

export function SPXFleetTab() {
  const api = useApi();
  const [fleet, setFleet] = useState({ bots: [], today_pnl: 0, month_pnl: 0, go_live_candidate: {} });
  const [goLiveStatus, setGoLiveStatus] = useState({ bug_free_days: 0, incidents: [] });
  const [loading, setLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState(null);
  const [botTrades, setBotTrades] = useState([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fleetData, goLiveData] = await Promise.all([
          api.fetchApi('/api/spx/fleet'),
          api.fetchApi('/api/golive/status')
        ]);
        setFleet(fleetData);
        setGoLiveStatus(goLiveData);
      } catch (e) {
        console.error('Failed to fetch SPX fleet:', e);
      }
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch trades when a bot is selected
  useEffect(() => {
    if (!selectedBot) {
      setBotTrades([]);
      return;
    }

    const fetchTrades = async () => {
      setTradesLoading(true);
      try {
        const data = await api.fetchApi(`/api/bots/${selectedBot.name}/trades`);
        setBotTrades(data.trades || []);
      } catch (e) {
        console.error('Failed to fetch SPX trades:', e);
        setBotTrades([]);
      }
      setTradesLoading(false);
    };

    fetchTrades();
  }, [selectedBot]);

  const handleCheckin = async () => {
    try {
      await api.fetchApi('/api/golive/checkin', { method: 'POST' });
      const data = await api.fetchApi('/api/golive/status');
      setGoLiveStatus(data);
    } catch (e) {
      console.error('Failed to check in:', e);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading SPX Fleet...</div>;
  }

  const candidate = fleet.go_live_candidate || {};
  const candidateResults = candidate.forward_test_results || {};

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">🎯 SPX Fleet Command</h2>
          <p className="text-slate-500">0DTE Credit Spread Strategy Fleet</p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="px-2 py-1 bg-purple-500/20 rounded">
            <span className="text-purple-400 text-xs font-medium">SHADOW</span>
          </div>
          <div className="bg-slate-800 rounded px-3 py-2">
            <span className="text-slate-500">Today:</span>
            <span className={`ml-2 font-mono font-bold ${fleet.today_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fleet.today_pnl >= 0 ? '+' : ''}${fleet.today_pnl?.toFixed(2) || 0}
            </span>
          </div>
          <div className="bg-slate-800 rounded px-3 py-2">
            <span className="text-slate-500">January:</span>
            <span className={`ml-2 font-mono font-bold ${fleet.month_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fleet.month_pnl >= 0 ? '+' : ''}${fleet.month_pnl?.toFixed(2) || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Go-Live Candidate Spotlight */}
      <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 rounded-xl p-6 border border-green-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h3 className="text-lg font-bold text-white">Go-Live Candidate: {candidate.bot}</h3>
              <p className="text-slate-400 text-sm">{candidate.display_name?.match(/\d+pt/)?.[0] || '45pt'} strikes | 100% target | 13:00 ET entry</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Target Launch</div>
            <div className="font-mono text-lg text-green-400">February 2026</div>
            <div className="text-sm text-slate-500">${candidate.capital?.toLocaleString()} capital</div>
          </div>
        </div>

        {/* Forward Test Progress */}
        <div className="grid grid-cols-5 gap-4 mt-4">
          <div className="bg-slate-800/50 rounded p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{candidateResults.trades || 0}</div>
            <div className="text-xs text-slate-500">Trades</div>
          </div>
          <div className="bg-slate-800/50 rounded p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{candidateResults.win_rate?.toFixed(0) || 0}%</div>
            <div className="text-xs text-slate-500">Win Rate</div>
          </div>
          <div className="bg-slate-800/50 rounded p-3 text-center">
            <div className="text-2xl font-bold text-green-400">+${candidateResults.pnl?.toFixed(0) || 0}</div>
            <div className="text-xs text-slate-500">P&L</div>
          </div>
          <div className="bg-slate-800/50 rounded p-3 text-center">
            <div className="text-2xl font-bold text-cyan-400">{candidateResults.wins || 0}</div>
            <div className="text-xs text-slate-500">Wins</div>
          </div>
          <div className="bg-slate-800/50 rounded p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{candidateResults.losses || 0}</div>
            <div className="text-xs text-slate-500">Losses</div>
          </div>
        </div>

        {/* Go-Live Tracker */}
        <div className="mt-6">
          <GoLiveTracker
            bugFreeDays={goLiveStatus.bug_free_days}
            incidents={goLiveStatus.incidents}
            onCheckin={handleCheckin}
          />
        </div>
      </div>

      {/* SPX Bot Grid */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Fleet Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fleet.bots?.map(bot => (
            <SPXBotCard
              key={bot.name}
              bot={bot}
              onClick={() => setSelectedBot(bot)}
              isCandidate={bot.name === candidate.bot}
            />
          ))}
        </div>
      </div>

      {/* Shadow vs Live Comparison Table */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Shadow Mode Comparison</h3>
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">Bot</th>
                <th className="px-4 py-3 text-left">Mode</th>
                <th className="px-4 py-3 text-left">Strike Distance</th>
                <th className="px-4 py-3 text-right">Today P&L</th>
                <th className="px-4 py-3 text-right">Month P&L</th>
                <th className="px-4 py-3 text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {fleet.bots?.map(bot => (
                <tr
                  key={bot.name}
                  className="border-t border-slate-700 hover:bg-slate-700/50 cursor-pointer active:bg-cyan-500/20"
                  onClick={() => setSelectedBot(bot)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isCrownJewelsBot(bot.name) && <span title="Crown Jewels - Best Performer">👑</span>}
                      {bot.name === 'SPX_F' && !isCrownJewelsBot(bot.name) && <span>🚀</span>}
                      <span className="font-medium text-white">{bot.display_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      bot.mode === 'LIVE' ? 'bg-green-500/20 text-green-400' :
                      bot.mode === 'FORWARD_TESTING' ? 'bg-cyan-500/20 text-cyan-400' :
                      bot.mode === 'CONTROL' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-600 text-slate-300'
                    }`} title={bot.mode === 'CONTROL' ? 'Diagnostic bot - not eligible for live capital' : ''}>
                      {bot.mode === 'CONTROL' ? '🐤 CONTROL' : bot.mode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{bot.config?.strike_distance}</td>
                  <td className={`px-4 py-3 text-right font-mono ${bot.today_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {bot.today_pnl >= 0 ? '+' : ''}${bot.today_pnl?.toFixed(2) || 0}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${bot.month_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {bot.month_pnl >= 0 ? '+' : ''}${bot.month_pnl?.toFixed(2) || 0}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white">{bot.win_rate?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Day Stats */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Event Day Performance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400">🚫</span>
              <span className="font-medium text-white">FOMC Days</span>
            </div>
            <div className="text-2xl font-bold text-red-400">BLOCKED</div>
            <div className="text-sm text-slate-500 mt-1">50% WR historical → Skip</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400">🚫</span>
              <span className="font-medium text-white">CPI Days</span>
            </div>
            <div className="text-2xl font-bold text-red-400">BLOCKED</div>
            <div className="text-sm text-slate-500 mt-1">50% WR historical → Skip</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400">🚫</span>
              <span className="font-medium text-white">NFP Days</span>
            </div>
            <div className="text-2xl font-bold text-red-400">BLOCKED</div>
            <div className="text-sm text-slate-500 mt-1">High volatility → Skip</div>
          </div>
        </div>
      </div>

      {/* Bot Detail Modal */}
      {selectedBot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBot(null)}>
          <div className="bg-slate-800 rounded-lg w-full max-w-lg max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{selectedBot.display_name}</h3>
              <button onClick={() => setSelectedBot(null)} className="text-slate-400 hover:text-white text-2xl">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400 text-sm">Mode</div>
                <div className={`font-bold ${
                  selectedBot.mode === 'LIVE' ? 'text-green-400' : 'text-cyan-400'
                }`}>{selectedBot.mode}</div>
              </div>
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400 text-sm">Status</div>
                <div className={`font-bold ${
                  selectedBot.status === 'RUNNING' ? 'text-green-400' : 'text-red-400'
                }`}>{selectedBot.status}</div>
              </div>
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400 text-sm">Strike Distance</div>
                <div className="font-bold text-white">{selectedBot.config?.strike_distance}</div>
              </div>
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400 text-sm">Entry Window</div>
                <div className="font-bold text-white">{selectedBot.config?.entry_window}</div>
              </div>
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400 text-sm">Target</div>
                <div className="font-bold text-white">{selectedBot.config?.target}</div>
              </div>
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400 text-sm">Win Rate</div>
                <div className="font-bold text-green-400">{selectedBot.win_rate?.toFixed(1)}%</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400 text-sm">Today P&L</div>
                <div className={`text-xl font-bold font-mono ${selectedBot.today_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedBot.today_pnl >= 0 ? '+' : ''}${selectedBot.today_pnl?.toFixed(2) || 0}
                </div>
              </div>
              <div className="bg-slate-700 rounded p-3">
                <div className="text-slate-400 text-sm">Month P&L</div>
                <div className={`text-xl font-bold font-mono ${selectedBot.month_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedBot.month_pnl >= 0 ? '+' : ''}${selectedBot.month_pnl?.toFixed(2) || 0}
                </div>
              </div>
            </div>

            {/* Trade History */}
            <div className="border-t border-slate-700 pt-4">
              <h4 className="font-semibold text-white mb-3">Trade History</h4>
              {tradesLoading ? (
                <div className="text-center text-slate-500 py-4">Loading trades...</div>
              ) : botTrades.length === 0 ? (
                <div className="text-center text-slate-500 py-4">No closed trades yet</div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700/50 sticky top-0">
                      <tr className="text-slate-400 text-xs">
                        <th className="px-2 py-2 text-left">Date</th>
                        <th className="px-2 py-2 text-right">Strike</th>
                        <th className="px-2 py-2 text-right">Contracts</th>
                        <th className="px-2 py-2 text-right">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {botTrades.map((trade, i) => (
                        <tr
                          key={i}
                          onClick={() => {
                            console.log('SPX TRADE CLICKED', trade);
                            setSelectedTrade(trade);
                          }}
                          className="border-t border-slate-700/50 cursor-pointer hover:bg-slate-700/30 active:bg-cyan-500/20"
                        >
                          <td className="px-2 py-2 text-slate-300 text-xs">
                            {trade.date || trade.timestamp?.slice(0, 10) || '--'}
                          </td>
                          <td className="px-2 py-2 text-right text-slate-300 font-mono text-xs">
                            {trade.strategy?.match(/@ ([\d.]+)/)?.[1] || '--'}
                          </td>
                          <td className="px-2 py-2 text-right text-slate-300 font-mono">
                            {trade.contracts || trade.qty || '--'}
                          </td>
                          <td className={`px-2 py-2 text-right font-mono font-bold ${
                            (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SPX Trade Detail Modal */}
      {selectedTrade && (
        <UnifiedDetailCard
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
        />
      )}
    </div>
  );
}
