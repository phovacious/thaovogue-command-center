import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

// PPO Sample Detail Modal
function PPOSampleDetailModal({ sample, onClose }) {
  if (!sample) return null;

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const isPositive = (sample.reward || 0) >= 0;
  const state = sample.state || {};
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl w-full max-w-md overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white">PPO Training Sample</h3>
            <p className="text-slate-400 text-sm">{sample.date}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white text-2xl rounded-full hover:bg-slate-700"
          >
            ×
          </button>
        </div>

        {/* Reward Hero */}
        <div className="p-4 bg-slate-900/50 text-center">
          <div className={`text-3xl font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}${(sample.reward || 0).toFixed(2)}
          </div>
          <div className="text-sm text-slate-500 mt-1">Reward Signal</div>
        </div>

        {/* Details */}
        <div className="p-4 space-y-3">
          {/* Action */}
          <div className="bg-cyan-500/20 rounded-lg p-3 border border-cyan-500/30">
            <div className="text-xs text-cyan-400 mb-1">Action Taken</div>
            <div className="text-white font-mono font-bold text-lg">{sample.action}</div>
          </div>

          {/* State Features */}
          <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
            <div className="text-xs text-purple-400 mb-2 font-medium">State Features</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500">VIX</div>
                <div className="text-white font-mono">{state.vix?.toFixed(2) || '--'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">SPX Range %</div>
                <div className="text-white font-mono">{state.spx_range_pct?.toFixed(2) || '--'}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Day of Week</div>
                <div className="text-white">{state.day_name || dayNames[state.day_of_week] || '--'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Event Day</div>
                <div className={state.is_event_day ? 'text-red-400' : 'text-slate-500'}>
                  {state.is_event_day ? 'Yes' : 'No'}
                </div>
              </div>
              {state.hour !== undefined && (
                <div>
                  <div className="text-xs text-slate-500">Hour (ET)</div>
                  <div className="text-white font-mono">{state.hour}:00</div>
                </div>
              )}
              {state.momentum !== undefined && (
                <div>
                  <div className="text-xs text-slate-500">Momentum</div>
                  <div className="text-white font-mono">{(state.momentum * 100).toFixed(2)}%</div>
                </div>
              )}
            </div>
          </div>

          {/* PPO Learning Context */}
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-2">What PPO Learns From This</div>
            <div className="text-sm text-slate-300">
              {isPositive ? (
                <>When VIX is ~{state.vix?.toFixed(1) || '?'} and range is ~{state.spx_range_pct?.toFixed(1) || '?'}%,
                action "{sample.action}" yields +${(sample.reward || 0).toFixed(0)} → <span className="text-green-400">Reinforce this behavior</span></>
              ) : (
                <>When VIX is ~{state.vix?.toFixed(1) || '?'} and range is ~{state.spx_range_pct?.toFixed(1) || '?'}%,
                action "{sample.action}" yields ${(sample.reward || 0).toFixed(0)} → <span className="text-red-400">Reduce this behavior</span></>
              )}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-4 border-t border-slate-700 sticky bottom-0 bg-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function PPOLabTab() {
  const api = useApi();
  const [status, setStatus] = useState(null);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [selectedSample, setSelectedSample] = useState(null);

  const fetchData = async () => {
    try {
      const [statusData, samplesData] = await Promise.all([
        api.fetchApi('/api/ppo/status'),
        api.fetchApi('/api/ppo/samples?limit=20')
      ]);
      setStatus(statusData);
      setSamples(samplesData.samples || []);
    } catch (e) {
      console.error('Failed to fetch PPO data:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCollectSamples = async () => {
    setCollecting(true);
    try {
      const result = await api.fetchApi('/api/ppo/collect', { method: 'POST' });
      alert(result.message || `Collected ${result.collected} samples`);
      await fetchData();
    } catch (e) {
      console.error('Failed to collect samples:', e);
      alert('Failed to collect samples');
    }
    setCollecting(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading PPO Lab...</div>;
  }

  const currentModel = status?.current_model || {};
  const dataCollection = status?.data_collection || {};
  const progressPct = Math.min(100, (dataCollection.total_samples / 200) * 100);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">🧠 PPO Lab</h2>
          <p className="text-slate-500">Reinforcement Learning Model Evolution</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCollectSamples}
            disabled={collecting}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors disabled:opacity-50"
          >
            {collecting ? 'Collecting...' : '🔄 Collect Samples'}
          </button>
          <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm transition-colors">
            📊 Export Samples
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-xl p-6 border border-cyan-500/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Model Status: {currentModel.version}</h3>
            <p className="text-slate-400">
              {currentModel.status === 'COLLECTING'
                ? 'Collecting training data...'
                : `Trained on ${currentModel.training_samples?.toLocaleString()} samples`}
            </p>
          </div>
          <div className={`px-3 py-1 rounded ${
            currentModel.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
            currentModel.status === 'TRAINING' ? 'bg-yellow-500/20 text-yellow-400' :
            currentModel.status === 'COLLECTING' ? 'bg-cyan-500/20 text-cyan-400' :
            currentModel.status === 'READY_TO_TRAIN' ? 'bg-purple-500/20 text-purple-400' :
            'bg-slate-500/20 text-slate-400'
          }`}>
            {currentModel.status}
          </div>
        </div>

        {/* Data Collection Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Training Data Progress</span>
            <span className="font-mono text-white">{dataCollection.total_samples || 0}/200 samples</span>
          </div>
          <div className="h-3 bg-slate-700 rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Need 200+ samples before first training
          </div>
        </div>

        {/* Sample Breakdown */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded p-3 text-center">
            <div className="text-2xl font-bold text-cyan-400">{dataCollection.total_samples || 0}</div>
            <div className="text-xs text-slate-500">Total Samples</div>
          </div>
          <div className="bg-slate-800/50 rounded p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{dataCollection.spx_samples || 0}</div>
            <div className="text-xs text-slate-500">SPX Samples</div>
          </div>
          <div className="bg-slate-800/50 rounded p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{dataCollection.equity_samples || 0}</div>
            <div className="text-xs text-slate-500">Equity Samples</div>
          </div>
          <div className="bg-slate-800/50 rounded p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {Math.round(progressPct)}%
            </div>
            <div className="text-xs text-slate-500">To Training</div>
          </div>
        </div>
      </div>

      {/* How PPO Learning Works */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">How PPO Learns</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-slate-700/50 rounded">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium text-white">State</div>
            <div className="text-slate-500 text-xs mt-1">VIX, range, day, event</div>
          </div>
          <div className="text-center p-3 bg-slate-700/50 rounded">
            <div className="text-2xl mb-2">🎯</div>
            <div className="font-medium text-white">Action</div>
            <div className="text-slate-500 text-xs mt-1">Which bot to run</div>
          </div>
          <div className="text-center p-3 bg-slate-700/50 rounded">
            <div className="text-2xl mb-2">💰</div>
            <div className="font-medium text-white">Reward</div>
            <div className="text-slate-500 text-xs mt-1">P&L result</div>
          </div>
        </div>
      </div>

      {/* Recent Samples */}
      <div>
        <h3 className="font-semibold text-white mb-3">Recent Training Samples</h3>
        {samples.length > 0 ? (
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">VIX</th>
                  <th className="px-4 py-3 text-left">Range %</th>
                  <th className="px-4 py-3 text-left">Day</th>
                  <th className="px-4 py-3 text-left">Event?</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-right">Reward</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((sample, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedSample(sample)}
                    className="border-t border-slate-700 cursor-pointer hover:bg-slate-700/50 active:bg-cyan-500/20"
                  >
                    <td className="px-4 py-2 font-mono text-slate-300">{sample.date}</td>
                    <td className="px-4 py-2 text-slate-300">{sample.state?.vix?.toFixed(2)}</td>
                    <td className="px-4 py-2 text-slate-300">{sample.state?.spx_range_pct?.toFixed(2)}%</td>
                    <td className="px-4 py-2 text-slate-300">{sample.state?.day_name || dayNames[sample.state?.day_of_week] || '-'}</td>
                    <td className="px-4 py-2">
                      {sample.state?.is_event_day ? (
                        <span className="text-red-400">Yes</span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-cyan-400">{sample.action}</td>
                    <td className={`px-4 py-2 text-right font-mono ${sample.reward >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {sample.reward >= 0 ? '+' : ''}${sample.reward?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg p-8 text-center text-slate-500">
            <div className="text-4xl mb-4">📊</div>
            <div>No training samples yet</div>
            <div className="text-sm mt-1">Samples will appear as trades are recorded</div>
          </div>
        )}
      </div>

      {/* Evolution Chart (Placeholder) */}
      <div>
        <h3 className="font-semibold text-white mb-3">Model Evolution</h3>
        <div className="bg-slate-800 rounded-lg p-4 h-64 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <div className="text-4xl mb-2">📈</div>
            <div>Evolution chart will appear after first training</div>
            <div className="text-sm mt-1">Need 200+ samples to begin</div>
          </div>
        </div>
      </div>

      {/* What PPO Will Learn */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-3">What PPO Will Learn (After 200+ Samples)</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <span>🎯</span>
            <div>
              <div className="font-medium text-white">Bot Selection</div>
              <div className="text-slate-500">Which SPX bot performs best in given conditions</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span>⚠️</span>
            <div>
              <div className="font-medium text-white">Skip Signals</div>
              <div className="text-slate-500">When to sit out (event days, high VIX)</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span>📊</span>
            <div>
              <div className="font-medium text-white">Regime Detection</div>
              <div className="text-slate-500">Adapt to trending vs ranging markets</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span>💰</span>
            <div>
              <div className="font-medium text-white">Position Sizing</div>
              <div className="text-slate-500">Confidence-based sizing (after 500+ samples)</div>
            </div>
          </div>
        </div>
      </div>

      {/* PPO Sample Detail Modal */}
      {selectedSample && (
        <PPOSampleDetailModal
          sample={selectedSample}
          onClose={() => setSelectedSample(null)}
        />
      )}
    </div>
  );
}
