import { PositionsTable } from './PositionsTable';
import { BotGrid } from './BotGrid';
import { EventsFeed } from './EventsFeed';
import { CopyButton } from './CopyButton';
import { useApi } from '../hooks/useApi';

export function LiveDesk({ deskData, onBotClick }) {
  const api = useApi();

  const positions = deskData?.positions || [];
  const bots = deskData?.bots || [];
  const events = deskData?.events || [];
  const dailyPnl = deskData?.daily_pnl || {};
  const summary = deskData?.summary || {};

  const pnl = dailyPnl.daily_pnl || 0;
  const pnlPct = dailyPnl.daily_pnl_pct || 0;
  const isPositive = pnl >= 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Daily P&L */}
        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Daily P&L</div>
          <div className={`text-2xl font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
          <div className={`text-sm ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
            {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
          </div>
        </div>

        {/* Equity */}
        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Equity</div>
          <div className="text-2xl font-mono font-bold text-white">
            ${(dailyPnl.equity || 0).toLocaleString()}
          </div>
          <div className="text-sm text-slate-500">
            BP: ${(dailyPnl.buying_power || 0).toLocaleString()}
          </div>
        </div>

        {/* Positions */}
        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Open Positions</div>
          <div className="text-2xl font-mono font-bold text-white">
            {summary.total_positions || positions.length}
          </div>
          <div className="text-sm text-slate-500">
            Value: ${(dailyPnl.positions_value || 0).toLocaleString()}
          </div>
        </div>

        {/* Bots */}
        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Bots Running</div>
          <div className="text-2xl font-mono font-bold text-green-400">
            {summary.running_bots || 0}
            <span className="text-slate-500 text-lg">/{summary.total_bots || bots.length}</span>
          </div>
          <div className="text-sm text-slate-500">
            Active fleet
          </div>
        </div>
      </div>

      {/* Copy Snapshot Button */}
      <div className="flex">
        <CopyButton
          label="📋 Copy Snapshot"
          getText={async () => {
            const data = await api.getCopySnapshot();
            return data.text;
          }}
        />
      </div>

      {/* Positions Table */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Open Positions</h3>
        <PositionsTable positions={positions} />
      </div>

      {/* Two Column Layout for Bots and Events */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <BotGrid bots={bots} onBotClick={onBotClick} />
        </div>
        <div>
          <EventsFeed events={events} />
        </div>
      </div>
    </div>
  );
}
