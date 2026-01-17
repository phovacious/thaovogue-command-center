import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

// Momentum Score Bar
function MomentumBar({ score, trending }) {
  const color = score >= 70 ? 'bg-green-500' :
                score >= 50 ? 'bg-yellow-500' :
                score >= 30 ? 'bg-orange-500' : 'bg-slate-600';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`font-mono text-sm ${score >= 50 ? 'text-cyan-400' : 'text-slate-400'}`}>
        {score.toFixed(0)}
      </span>
      {trending && <span className="text-xs">🔥</span>}
    </div>
  );
}

// Theme Card
function ThemeCard({ theme, onClick }) {
  const isTrending = theme.trending || theme.momentum_score >= 50;

  return (
    <div
      onClick={() => onClick(theme)}
      className={`bg-slate-800 rounded-lg p-4 border cursor-pointer transition-all hover:scale-102 ${
        isTrending ? 'border-cyan-500/50 hover:border-cyan-400' : 'border-slate-700 hover:border-slate-600'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-white">{theme.theme || theme.name}</h3>
        {isTrending && (
          <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400 font-bold">
            TRENDING
          </span>
        )}
      </div>

      <MomentumBar score={theme.momentum_score || 0} trending={isTrending} />

      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
        <div>
          <span className="text-slate-500">24h</span>
          <div className="font-mono text-white">{theme.hits_24h || 0}</div>
        </div>
        <div>
          <span className="text-slate-500">7d</span>
          <div className="font-mono text-white">{theme.hits_7d || 0}</div>
        </div>
        <div>
          <span className="text-slate-500">30d</span>
          <div className="font-mono text-white">{theme.hits_30d || 0}</div>
        </div>
      </div>

      {theme.top_tickers?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {theme.top_tickers.slice(0, 4).map(([ticker, count], i) => (
            <span key={i} className="px-1.5 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
              {ticker}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Theme Detail Modal
function ThemeDetailModal({ theme, onClose }) {
  if (!theme) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{theme.theme || theme.name}</h2>
            <p className="text-sm text-slate-400">Theme Analysis</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          {/* Momentum */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="font-bold text-white mb-3">📈 Momentum</h3>
            <div className="mb-3">
              <MomentumBar score={theme.momentum_score || 0} trending={theme.trending} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-mono text-cyan-400">{theme.hits_24h || 0}</div>
                <div className="text-xs text-slate-400">Last 24h</div>
              </div>
              <div>
                <div className="text-2xl font-mono text-white">{theme.hits_7d || 0}</div>
                <div className="text-xs text-slate-400">Last 7d</div>
              </div>
              <div>
                <div className="text-2xl font-mono text-slate-300">{theme.hits_30d || 0}</div>
                <div className="text-xs text-slate-400">Last 30d</div>
              </div>
            </div>
          </div>

          {/* Top Tickers */}
          {theme.top_tickers?.length > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="font-bold text-white mb-3">🎯 Top Tickers</h3>
              <div className="space-y-2">
                {theme.top_tickers.map(([ticker, count], i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="font-mono text-white">{ticker}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500"
                          style={{ width: `${(count / theme.top_tickers[0][1]) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-400 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment */}
          {theme.sentiment && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="font-bold text-white mb-3">😊 Sentiment</h3>
              <div className="flex gap-4">
                <div className="flex-1 text-center">
                  <div className="text-2xl font-mono text-green-400">{theme.sentiment.bullish || 0}</div>
                  <div className="text-xs text-slate-400">Bullish</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-mono text-slate-400">{theme.sentiment.neutral || 0}</div>
                  <div className="text-xs text-slate-400">Neutral</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-mono text-red-400">{theme.sentiment.bearish || 0}</div>
                  <div className="text-xs text-slate-400">Bearish</div>
                </div>
              </div>
            </div>
          )}

          {/* Keywords */}
          {theme.keywords?.length > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="font-bold text-white mb-3">🔑 Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {theme.keywords.map((kw, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-600 rounded text-sm text-slate-300">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Articles */}
          {theme.recent_articles?.length > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="font-bold text-white mb-3">📰 Recent Articles</h3>
              <div className="space-y-2">
                {theme.recent_articles.slice(0, 5).map((article, i) => (
                  <a
                    key={i}
                    href={article.article_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 bg-slate-600/50 rounded hover:bg-slate-600 transition-colors"
                  >
                    <div className="text-sm text-white line-clamp-1">{article.article_title}</div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>{article.source}</span>
                      <span>{new Date(article.timestamp).toLocaleDateString()}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Basket Suggestion Card
function BasketSuggestionCard({ suggestion }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-yellow-500/30">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-white">{suggestion.display_name}</h3>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
          suggestion.confidence === 'HIGH' ? 'bg-green-500/20 text-green-400' :
          suggestion.confidence === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-orange-500/20 text-orange-400'
        }`}>
          {suggestion.confidence}
        </span>
      </div>

      <p className="text-sm text-slate-400 mb-3">{suggestion.reason}</p>

      <div className="mb-3">
        <MomentumBar score={suggestion.momentum_score} />
      </div>

      <div className="space-y-1">
        {suggestion.tickers?.slice(0, 5).map((t, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="font-mono text-white">{t.ticker}</span>
            <span className="text-cyan-400">{(t.weight * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Themes Tab Component
export function ThemesTab() {
  const api = useApi();
  const [themes, setThemes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch all themes
      const themesData = await api.fetchApi('/api/themes/all');
      setThemes(themesData?.themes || []);

      // Fetch basket suggestions
      const suggestData = await api.fetchApi('/api/themes/suggestions');
      setSuggestions(suggestData?.suggestions || []);
    } catch (e) {
      console.error('Failed to fetch themes data:', e);
    }
    setLoading(false);
  };

  const runScan = async () => {
    setScanning(true);
    try {
      await api.fetchApi('/api/themes/scan', { method: 'POST' });
      await fetchData();
    } catch (e) {
      console.error('Scan failed:', e);
    }
    setScanning(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Sort themes by momentum
  const sortedThemes = [...themes].sort((a, b) => (b.momentum_score || 0) - (a.momentum_score || 0));
  const trendingThemes = sortedThemes.filter(t => t.momentum_score >= 50);
  const otherThemes = sortedThemes.filter(t => t.momentum_score < 50);

  if (loading) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-slate-400">Loading theme data...</p>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>📈</span> Theme Discovery
        </h1>
        <button
          onClick={runScan}
          disabled={scanning}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            scanning
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
        >
          {scanning ? '🔄 Scanning...' : '🔍 Scan Now'}
        </button>
      </div>

      {/* Trending Themes */}
      {trendingThemes.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🔥</span> Trending Themes
            <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-sm">
              {trendingThemes.length} hot
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {trendingThemes.map((theme, i) => (
              <ThemeCard key={i} theme={theme} onClick={setSelectedTheme} />
            ))}
          </div>
        </section>
      )}

      {/* Basket Suggestions */}
      {suggestions.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>💡</span> Auto-Generated Basket Suggestions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion, i) => (
              <BasketSuggestionCard key={i} suggestion={suggestion} />
            ))}
          </div>
        </section>
      )}

      {/* All Themes */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>📊</span> All Themes
          <span className="text-sm text-slate-400 font-normal">({themes.length} tracked)</span>
        </h2>
        {otherThemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {otherThemes.map((theme, i) => (
              <ThemeCard key={i} theme={theme} onClick={setSelectedTheme} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-400">
            No themes tracked yet. Run a scan to discover themes.
          </div>
        )}
      </section>

      {/* Theme Detail Modal */}
      {selectedTheme && (
        <ThemeDetailModal
          theme={selectedTheme}
          onClose={() => setSelectedTheme(null)}
        />
      )}
    </div>
  );
}
