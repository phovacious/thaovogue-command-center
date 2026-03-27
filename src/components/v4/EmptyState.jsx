/**
 * Empty state component for sections with no data
 */
export function EmptyState({ icon = '📭', title, description, className = '' }) {
  return (
    <div className={`bg-slate-800/50 rounded-xl p-8 text-center ${className}`}>
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-slate-300 font-medium mb-1">{title}</div>
      {description && (
        <div className="text-slate-500 text-sm">{description}</div>
      )}
    </div>
  );
}

/**
 * Loading skeleton
 */
export function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-700/50 rounded-lg" />
      ))}
    </div>
  );
}

/**
 * Section card wrapper
 */
export function SectionCard({ title, subtitle, children, className = '', headerRight }) {
  return (
    <div className={`bg-slate-800/70 rounded-xl border border-slate-700/50 overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">{title}</h3>
            {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
          </div>
          {headerRight}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

/**
 * Data refresh indicator
 */
export function DataRefreshIndicator({ lastUpdate, isLoading }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      {isLoading && (
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
      )}
      {lastUpdate && (
        <span>Updated {lastUpdate.toLocaleTimeString()}</span>
      )}
    </div>
  );
}
