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
    'UNKNOWN': { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  };
  const c = config[tier] || config['UNKNOWN'];
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs ${c.bg} ${c.text}`}>
      {tier}
    </span>
  );
}

// Urgency badge component
function UrgencyBadge({ urgency, icon }) {
  const config = {
    'HIGH': { bg: 'bg-red-500/20', text: 'text-red-400' },
    'MEDIUM': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    'LOW': { bg: 'bg-green-500/20', text: 'text-green-400' },
    'VERY_LOW': { bg: 'bg-slate-500/20', text: 'text-slate-300' },
    'WAIT': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  };
  const c = config[urgency] || config['WAIT'];
  return (
    <span className={`px-2 py-1 rounded text-sm font-bold ${c.bg} ${c.text} flex items-center gap-1`}>
      <span>{icon}</span> {urgency.replace('_', ' ')}
    </span>
  );
}

// DCA Recommendation Modal
function DCARecommendationModal({ data, onClose }) {
  if (!data) return null;

  const isRisky = data.tier === 'SPECULATIVE' || data.tier === 'AVOID' || data.tier === 'UNKNOWN';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{data.ticker}</h2>
              <TierBadge tier={data.tier} />
              {data.hold_ok && <span className="text-green-400 text-sm">✅</span>}
            </div>
            <p className="text-sm text-slate-400">{data.company_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[65vh] space-y-4">
          {/* Price Info */}
          <div className="grid grid-cols-3 gap-4 bg-slate-700/50 rounded-lg p-4">
            <div className="text-center">
              <div className="text-xs text-slate-400">Current</div>
              <div className="text-xl font-mono text-white">${data.current_price}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">52W High</div>
              <div className="text-xl font-mono text-cyan-400">${data.high_52w}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">Distance</div>
              <div className={`text-xl font-mono font-bold ${
                data.distance_from_high >= 25 ? 'text-red-400' :
                data.distance_from_high >= 15 ? 'text-orange-400' :
                data.distance_from_high >= 5 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                -{data.distance_from_high}%
              </div>
            </div>
          </div>

          {/* Thesis */}
          {data.thesis && (
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Investment Thesis</div>
              <div className="text-sm text-white">{data.thesis}</div>
            </div>
          )}

          {/* Warnings */}
          {data.warnings?.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              {data.warnings.map((w, i) => (
                <div key={i} className="text-sm text-red-400">{w}</div>
              ))}
            </div>
          )}

          {/* Adaptive DCA Recommendation */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                📊 Adaptive DCA Recommendation
              </h3>
              <UrgencyBadge urgency={data.urgency} icon={data.urgency_icon} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-slate-400">Tranches</div>
                <div className="text-lg font-mono text-white">{data.tranches}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Strategy</div>
                <div className="text-sm text-cyan-400">{data.reasoning}</div>
              </div>
            </div>

            {/* Schedule */}
            <div className="mt-4">
              <div className="text-xs text-slate-400 mb-2">
                Schedule for ${data.amount.toLocaleString()}:
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.schedule.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-16 text-xs text-slate-500">Week {s.week}</div>
                    <div className="flex-1 h-6 bg-slate-600 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full ${
                          i === 0 && data.urgency === 'HIGH' ? 'bg-red-500' :
                          i === 0 ? 'bg-cyan-500' : 'bg-cyan-600/70'
                        }`}
                        style={{ width: `${s.pct * 2}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-mono">
                        ${s.amount} ({s.pct}%)
                      </span>
                    </div>
                    <div className="w-20 text-xs text-slate-400 text-right">
                      ~{s.shares} shares
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fundamentals */}
          {data.fundamentals && (
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h3 className="font-bold text-white mb-3">📈 Fundamentals</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {data.fundamentals.pe_ratio && (
                  <div>
                    <div className="text-xs text-slate-400">P/E Ratio</div>
                    <div className={`font-mono ${data.fundamentals.pe_ratio > 30 ? 'text-orange-400' : 'text-white'}`}>
                      {data.fundamentals.pe_ratio}
                    </div>
                  </div>
                )}
                {data.fundamentals.forward_pe && (
                  <div>
                    <div className="text-xs text-slate-400">Forward P/E</div>
                    <div className="font-mono text-white">{data.fundamentals.forward_pe}</div>
                  </div>
                )}
                {data.fundamentals.market_cap_b && (
                  <div>
                    <div className="text-xs text-slate-400">Market Cap</div>
                    <div className="font-mono text-white">${data.fundamentals.market_cap_b}B</div>
                  </div>
                )}
                {data.fundamentals.fcf_m && (
                  <div>
                    <div className="text-xs text-slate-400">Free Cash Flow</div>
                    <div className={`font-mono ${data.fundamentals.fcf_m > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${data.fundamentals.fcf_m}M
                    </div>
                  </div>
                )}
                {data.fundamentals.debt_to_equity && (
                  <div>
                    <div className="text-xs text-slate-400">Debt/Equity</div>
                    <div className={`font-mono ${data.fundamentals.debt_to_equity > 100 ? 'text-orange-400' : 'text-white'}`}>
                      {data.fundamentals.debt_to_equity}%
                    </div>
                  </div>
                )}
                {data.fundamentals.sector && (
                  <div>
                    <div className="text-xs text-slate-400">Sector</div>
                    <div className="text-white">{data.fundamentals.sector}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {data.hold_ok ? '✅ Safe for 1-year hold' : '⚠️ Day trade only'}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// DCA Analyzer Component
function DCAAnalyzer({ api }) {
  const [ticker, setTicker] = useState('');
  const [amount, setAmount] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyze = async () => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchApi(`/api/value/dca-recommendation?ticker=${ticker.toUpperCase()}&amount=${amount}`);
      if (data.status === 'ok') {
        setResult(data);
      } else {
        setError(data.message || 'Failed to analyze');
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          🔍 DCA Analyzer
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Ticker (e.g., AAPL)"
            className="flex-1 px-3 py-2 bg-slate-700 rounded text-white placeholder-slate-500 font-mono"
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Amount"
            className="w-28 px-3 py-2 bg-slate-700 rounded text-white font-mono"
          />
          <button
            onClick={analyze}
            disabled={loading || !ticker}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              loading || !ticker
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {loading ? '...' : 'Analyze'}
          </button>
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-400">{error}</div>
        )}
      </div>

      {result && (
        <DCARecommendationModal data={result} onClose={() => setResult(null)} />
      )}
    </>
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

// Basket Detail Modal with DCA for each holding
function BasketDetailModal({ basket, onClose, onAnalyzeTicker }) {
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
                      <button
                        onClick={() => onAnalyzeTicker(h.ticker)}
                        className="font-mono text-white font-bold hover:text-cyan-400 transition-colors"
                      >
                        {h.ticker}
                      </button>
                      <TierBadge tier={h.tier} />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-cyan-400 font-mono">{(h.weight * 100).toFixed(0)}%</span>
                      <button
                        onClick={() => onAnalyzeTicker(h.ticker)}
                        className="text-xs px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-slate-300"
                      >
                        DCA
                      </button>
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
                      <button
                        onClick={() => onAnalyzeTicker(h.ticker)}
                        className="font-mono text-white font-bold hover:text-orange-400 transition-colors"
                      >
                        {h.ticker}
                      </button>
                      <TierBadge tier={h.tier} />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-orange-400 font-mono">{(h.weight * 100).toFixed(0)}%</span>
                      <button
                        onClick={() => onAnalyzeTicker(h.ticker)}
                        className="text-xs px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-slate-300"
                      >
                        DCA
                      </button>
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
            <span className="text-cyan-400 font-bold">Tip:</span> Click any ticker to see adaptive DCA recommendation
          </p>
        </div>
      </div>
    </div>
  );
}

// DCA Opportunity Card (enhanced)
function DCAOpportunityCard({ opportunity, onAnalyze }) {
  return (
    <div
      className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-colors"
      onClick={() => onAnalyze(opportunity.ticker)}
    >
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
      <div className="mt-2 text-xs text-cyan-400">Click for DCA schedule →</div>
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
  const [dcaResult, setDcaResult] = useState(null);

  const analyzeTicker = async (ticker) => {
    try {
      const data = await api.fetchApi(`/api/value/dca-recommendation?ticker=${ticker}&amount=1000`);
      if (data.status === 'ok') {
        setDcaResult(data);
        setSelectedBasket(null); // Close basket modal
      }
    } catch (e) {
      console.error('DCA analysis failed:', e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const basketsData = await api.fetchApi('/api/value/baskets');
        setBaskets(basketsData?.baskets || []);

        const oppsData = await api.fetchApi('/api/value/opportunities');
        setOpportunities(oppsData?.opportunities || []);

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
    const interval = setInterval(fetchData, 60000);
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

      {/* DCA Analyzer */}
      <section>
        <DCAAnalyzer api={api} />
      </section>

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
              <DCAOpportunityCard key={i} opportunity={opp} onAnalyze={analyzeTicker} />
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
                  <th className="px-4 py-2 text-right text-xs text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item, i) => (
                  <tr key={i} className="border-t border-slate-700 hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => analyzeTicker(item.ticker)}
                        className="font-mono font-bold text-white hover:text-cyan-400"
                      >
                        {item.ticker}
                      </button>
                    </td>
                    <td className="px-4 py-3"><TierBadge tier={item.tier} /></td>
                    <td className="px-4 py-3 text-sm text-slate-400">{item.thesis}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => analyzeTicker(item.ticker)}
                        className="text-xs px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-white"
                      >
                        Analyze DCA
                      </button>
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
        <BasketDetailModal
          basket={selectedBasket}
          onClose={() => setSelectedBasket(null)}
          onAnalyzeTicker={analyzeTicker}
        />
      )}

      {/* DCA Recommendation Modal */}
      {dcaResult && (
        <DCARecommendationModal data={dcaResult} onClose={() => setDcaResult(null)} />
      )}
    </div>
  );
}
