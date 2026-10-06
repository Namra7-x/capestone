import { Icons } from '../../utils/icons.jsx';

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon || Icons.inbox}</div>
      <div className="empty-title">{title}</div>
      {description && <div className="empty-desc">{description}</div>}
      {action}
    </div>
  );
}

export function TodoSkeleton() {
  return (
    <div aria-label="Loading tasks">
      {[0, 1, 2, 3, 4].map((i) => (
        <div className="skeleton-row" key={i}>
          <div className="skeleton" style={{ width: 19, height: 19, borderRadius: 6, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 12, width: `${55 + ((i * 13) % 30)}%`, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 10, width: `${25 + ((i * 7) % 20)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="stats-grid">
      {[0, 1, 2, 3].map((i) => (
        <div className="stat-card" key={i}>
          <div className="skeleton" style={{ height: 10, width: '50%', marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 26, width: '35%' }} />
        </div>
      ))}
    </div>
  );
}
