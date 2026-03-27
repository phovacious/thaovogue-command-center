import { useState, useEffect } from 'react';
import { formatCurrency, formatPercent, formatDateTime, formatRelativeTime } from '../../types/v4Types';

/**
 * Trade detail modal/bottom sheet for mobile-first display
 */
export function TradeDetailModal({ position, onClose }) {
  const [isClosing, setIsClosing] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  if (!position) return null;

  const isStale = position.isStalePrice;
  const isPositive = position.unrealizedPnl > 0;
  const isNegative = position.unrealizedPnl < 0;
  const pnlColor = isStale ? 'text-slate-500' : isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-300';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-200 ease-out ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="bg-slate-800 rounded-t-2xl border-t border-slate-700 max-h-[85vh] overflow-y-auto">
          {/* Handle bar */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 bg-slate-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-4 pb-3 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white font-mono">{position.symbol}</span>
                <ModeBadge mode={position.mode} venue={position.venue} />
              </div>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-white p-2 -mr-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Signal/Tier badge */}
            {(position.signalName || position.tier) && (
              <div className="flex items-center gap-2 mt-2">
                {position.tier && (
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {position.tier}
                  </span>
                )}
                {position.signalName && position.signalName !== position.tier && (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    {position.signalName}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* P&L Hero Section */}
          <div className="px-4 py-4 bg-slate-900/50">
            <div className="text-center">
              {isStale ? (
                <div>
                  <div className="text-3xl font-mono text-slate-500">--</div>
                  <div className="text-sm text-slate-500 mt-1">
                    <StaleBadge reason={position.staleReason} />
                  </div>
                </div>
              ) : (
                <div>
                  <div className={`text-3xl font-bold font-mono ${pnlColor}`}>
                    {formatPercent(position.unrealizedPnlPct)}
                  </div>
                  <div className={`text-lg font-mono ${pnlColor} opacity-80`}>
                    {isPositive ? '+' : ''}{formatCurrency(position.unrealizedPnl)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="px-4 py-4 space-y-4">
            {/* Entry Info */}
            <DetailSection title="Entry">
              <DetailRow label="Entry Price" value={`$${position.entryPrice?.toFixed(2)}`} />
              <DetailRow label="Entry Date" value={position.dateDisplay || '--'} />
              <DetailRow label="Position Size" value={formatCurrency(position.sizeUsd || position.costBasis || position.marketValue)} />
              <DetailRow label="Quantity" value={position.qty?.toFixed(4)} mono />
              <DetailRow label="Cost Basis" value={formatCurrency(position.costBasis)} />
            </DetailSection>

            {/* Current Info */}
            <DetailSection title="Current">
              <DetailRow
                label="Current Price"
                value={isStale ? '--' : `$${position.currentPrice?.toFixed(2)}`}
                valueColor={
                  isStale ? 'text-slate-500' :
                  position.currentPrice > position.entryPrice ? 'text-green-400' :
                  position.currentPrice < position.entryPrice ? 'text-red-400' : 'text-slate-300'
                }
              />
              <DetailRow
                label="Market Value"
                value={isStale ? formatCurrency(position.costBasis) + ' (cost)' : formatCurrency(position.marketValue)}
                valueColor={isStale ? 'text-slate-500' : 'text-white'}
              />
              <DetailRow
                label="P&L"
                value={isStale ? '--' : `${formatPercent(position.unrealizedPnlPct)} / ${formatCurrency(position.unrealizedPnl)}`}
                valueColor={pnlColor}
              />
              <DetailRow
                label="Quote Status"
                value={<QuoteStatusBadge status={position.quoteStatus} reason={position.staleReason} />}
              />
              <DetailRow
                label="Last Quote"
                value={position.quoteTimeDisplay || (position.quoteStatus === 'fresh' ? 'Just now' : '--')}
              />
            </DetailSection>

            {/* Trade Parameters */}
            {(position.takeProfit || position.stopLoss) && (
              <DetailSection title="Parameters">
                {position.takeProfit && (
                  <DetailRow
                    label="Take Profit"
                    value={`$${position.takeProfit.toFixed(2)}`}
                    valueColor="text-green-400"
                  />
                )}
                {position.stopLoss && (
                  <DetailRow
                    label="Stop Loss"
                    value={`$${position.stopLoss.toFixed(2)}`}
                    valueColor="text-red-400"
                  />
                )}
              </DetailSection>
            )}

            {/* Meta Info */}
            <DetailSection title="Info">
              <DetailRow label="Bot" value={position.botName} />
              <DetailRow label="Venue" value={position.venue?.charAt(0).toUpperCase() + position.venue?.slice(1)} />
              <DetailRow label="Mode" value={position.mode?.toUpperCase()} />
              {position.positionId && (
                <DetailRow
                  label="Position ID"
                  value={<span className="text-xs truncate max-w-[180px] inline-block">{position.positionId}</span>}
                  mono
                />
              )}
            </DetailSection>
          </div>

          {/* Bottom padding for safe area */}
          <div className="h-6" />
        </div>
      </div>
    </>
  );
}

function ModeBadge({ mode, venue }) {
  const isLive = mode === 'live';
  const venueName = venue === 'kraken' ? 'Kraken' : venue === 'schwab' ? 'Schwab' : '';

  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
        isLive
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      }`}>
        {isLive ? 'LIVE' : 'PAPER'}
      </span>
      {venueName && (
        <span className="text-xs text-slate-400">{venueName}</span>
      )}
    </div>
  );
}

function StaleBadge({ reason }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {reason || 'Stale'}
    </span>
  );
}

function QuoteStatusBadge({ status, reason }) {
  if (status === 'fresh') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Fresh
      </span>
    );
  }

  if (status === 'stale') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {reason || 'Stale'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
      No quote
    </span>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="bg-slate-900/30 rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="px-3 py-2 bg-slate-700/30 border-b border-slate-700/50">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="divide-y divide-slate-700/30">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value, valueColor = 'text-white', mono = false }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm ${valueColor} ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

export default TradeDetailModal;
