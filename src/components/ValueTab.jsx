import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

// Basket safety badge component
function SafetyBadge({ rating }) {
  const config = {
    'SAFE': { bg: 'bg-green-500/20', text: 'text-green-400', label: 'SAFE' },
    'MODERATE': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'MODERATE' },
    'RISKY': { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'RISKY' },
    'AVOID': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'AVOID' },
  };
  const c = config[rating] || config['AVOID'];
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

// Tier badge component
function TierBadge({ tier }) {
  const config = {
    'FORTRESS': { bg: 'bg-green-500/20', text: 'text-green-400' },
    'SOLID': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    'SPECULATIVE': { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    'AVOID': { bg: 'bg-red-500/20', text: 'text-red-400' },
  };
  const c = config[tier] || config['AVOID'];
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs ${c.bg} ${c.text}`}>
      {tier}
    </span>
  );
}

// Basket Card Component
function BasketCard({ basket, onSelect }) {
  const safetyRating = basket.safe_weight >= 0.8 ? 'SAFE' :
                       basket.safe_weight >= 0.6 ? 'MODERATE' :
                       basket.safe_weight >= 0.4 ? 'RISKY' : 'AVOID';

  return (
    <div
      onClick={() => onSelect(basket)}
      className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 cursor-pointer transition-colors border border-slate-700 hover:border-cyan-500/50"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-white">{basket.name}</h3>
        <SafetyBadge rating={safetyRating} />
      </div>
      <p className="text-sm text-slate-400 mb-3">{basket.theme}</p>
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-500">{basket.holdings_count} holdings</span>
        <span className="font-mono text-cyan-400">{(basket.safe_weight * 100).toFixed(0)}% safe</span>
      </div>
      <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-cyan-500"
          style={{ width: `${basket.safe_weight * 100}%` }}
        />
      </div>
    </div>
  );
}

// Basket Detail Modal
function BasketDetailModal({ basket, onClose }) {
  if (!basket) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{basket.display_name || basket.name}</h2>
            <p className="text-sm text-slate-400">{basket.theme}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Safe Holdings */}
          {basket.safe_holdings?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-green-400 font-bold mb-2">
                ✅ SAFE FOR 1-YEAR HOLD ({(basket.safe_weight * 100).toFixed(0)}%)
              </h3>
              <div className="space-y-2">
                {basket.safe_holdings.map((h, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-700/50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white font-bold">{h.ticker}</span>
                      <TierBadge tier={h.tier} />
                    </div>
                    <div className="text-right">
                      <span className="text-cyan-400 font-mono">{(h.weight * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risky Holdings */}
          {basket.risky_holdings?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-orange-400 font-bold mb-2">
                ⚠️ DAY TRADE ONLY ({(basket.risky_weight * 100).toFixed(0)}%)
              </h3>
              <div className="space-y-2">
                {basket.risky_holdings.map((h, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-700/50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white font-bold">{h.ticker}</span>
                      <TierBadge tier={h.tier} />
                    </div>
                    <div className="text-right">
                      <span className="text-orange-400 font-mono">{(h.weight * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Excluded */}
          {basket.excluded?.length > 0 && (
            <div>
              <h3 className="text-red-400 font-bold mb-2">
                ❌ EXCLUDED ({(basket.excluded_weight * 100).toFixed(0)}%)
              </h3>
              <div className="space-y-2">
                {basket.excluded.map((h, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-700/50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">{h.ticker}</span>
                      <span className="text-xs text-red-400">{h.reason}</span>
                    </div>
                    <span className="text-slate-500 font-mono">{(h.weight * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <p className="text-sm text-slate-400">
            <span className="text-cyan-400 font-bold">Recommendation:</span> {basket.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

// DCA Opportunity Card
function DCAOpportunityCard({ opportunity }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-mono text-lg font-bold text-white">{opportunity.ticker}</span>
          <TierBadge tier={opportunity.tier} />
        </div>
        <span className={`font-mono font-bold ${opportunity.drawdown <= -0.4 ? 'text-red-400' : 'text-orange-400'}`}>
          {(opportunity.drawdown * 100).toFixed(1)}%
        </span>
      </div>
      <div className="text-sm text-slate-400 mb-2">{opportunity.thesis}</div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Regime: <span className="text-cyan-400">{opportunity.regime}</span></span>
        <span className="text-slate-500">Tranche: <span className="text-yellow-400">{opportunity.tranche}/5</span></span>
      </div>
    </div>
  );
}

// Main Value Tab Component
export function ValueTab() {
  const api = useApi();
  const [baskets, setBaskets] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [selectedBasket, setSelectedBasket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch baskets
        const basketsData = await api.fetchApi('/api/value/baskets');
        setBaskets(basketsData?.baskets || []);

        // Fetch DCA opportunities
        const oppsData = await api.fetchApi('/api/value/opportunities');
        setOpportunities(oppsData?.opportunities || []);

        // Fetch watchlist
        const watchData = await api.fetchApi('/api/value/watchlist');
        setWatchlist(watchData?.watchlist || []);

        setError(null);
      } catch (e) {
        console.error('Failed to fetch value data:', e);
        setError('Failed to load data. API may be offline.');
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-slate-400">Loading value data...</p>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* DCA Opportunities */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>💰</span> DCA Opportunities
          {opportunities.length > 0 && (
            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-sm">
              {opportunities.length} active
            </span>
          )}
        </h2>
        {opportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map((opp, i) => (
              <DCAOpportunityCard key={i} opportunity={opp} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-400">No DCA opportunities at current levels</p>
            <p className="text-sm text-slate-500 mt-2">Waiting for 30%+ drawdowns from 52-week highs</p>
          </div>
        )}
      </section>

      {/* Thematic Baskets */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>🧺</span> Thematic Baskets
          <span className="text-sm text-slate-400 font-normal">({baskets.length} baskets)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {baskets.map((basket, i) => (
            <BasketCard key={i} basket={basket} onSelect={setSelectedBasket} />
          ))}
        </div>
      </section>

      {/* Watchlist */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>👀</span> DCA Watchlist
        </h2>
        {watchlist.length > 0 ? (
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-slate-400">Ticker</th>
                  <th className="px-4 py-2 text-left text-xs text-slate-400">Tier</th>
                  <th className="px-4 py-2 text-left text-xs text-slate-400">Thesis</th>
                  <th className="px-4 py-2 text-right text-xs text-slate-400">Max Alloc</th>
                  <th className="px-4 py-2 text-right text-xs text-slate-400">Tranches</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item, i) => (
                  <tr key={i} className="border-t border-slate-700 hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-mono font-bold text-white">{item.ticker}</td>
                    <td className="px-4 py-3"><TierBadge tier={item.tier} /></td>
                    <td className="px-4 py-3 text-sm text-slate-400">{item.thesis}</td>
                    <td className="px-4 py-3 text-right font-mono text-cyan-400">
                      {(item.tranche_size * item.max_tranches * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">
                      {item.max_tranches}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
            No watchlist items configured
          </div>
        )}
      </section>

      {/* Basket Detail Modal */}
      {selectedBasket && (
        <BasketDetailModal basket={selectedBasket} onClose={() => setSelectedBasket(null)} />
      )}
    </div>
  );
}
