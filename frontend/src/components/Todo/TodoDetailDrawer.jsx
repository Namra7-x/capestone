import { useEffect, useState } from 'react';
import { Icons } from '../../utils/icons.jsx';
import { dueChipClass, formatDate, formatDateTime, isOverdue, isToday } from '../../utils/date.js';

const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

export function TodoDetailDrawer({ todo, onClose, onToggle, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!todo) return;
    setConfirming(false);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [todo, onClose]);

  if (!todo) return null;

  const overdue = isOverdue(todo.dueDate, todo.status);
  const today = isToday(todo.dueDate);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(todo);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Task details">
        <div className="drawer-header">
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)' }}>
            Task details
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="Close details">
            {Icons.x}
          </button>
        </div>

        <div className="drawer-body">
          <h2 className={`drawer-title${todo.status === 'completed' ? ' completed' : ''}`}>
            {todo.title}
          </h2>

          {todo.description ? (
            <p className="drawer-desc">{todo.description}</p>
          ) : (
            <p className="drawer-desc" style={{ fontStyle: 'italic', opacity: 0.6 }}>
              No description
            </p>
          )}

          <div className="prop-row">
            <span className="prop-label">Status</span>
            <span className="prop-value">
              <span className={`chip ${todo.status === 'completed' ? 'chip-status-completed' : 'chip-due'}`}>
                {todo.status === 'completed' ? Icons.check : Icons.clock}
                {todo.status === 'completed' ? 'Completed' : 'Active'}
              </span>
            </span>
          </div>

          <div className="prop-row">
            <span className="prop-label">Priority</span>
            <span className="prop-value">
              <span className={`chip chip-priority-${todo.priority}`}>
                {Icons.flag}
                {PRIORITY_LABELS[todo.priority]}
              </span>
            </span>
          </div>

          <div className="prop-row">
            <span className="prop-label">Due date</span>
            <span className="prop-value">
              {todo.dueDate ? (
                <span className={dueChipClass(todo.dueDate, todo.status)}>
                  {Icons.calendar}
                  {today ? 'Today' : overdue ? `Overdue · ${formatDate(todo.dueDate)}` : formatDate(todo.dueDate)}
                </span>
              ) : (
                <span style={{ color: 'var(--text-tertiary)' }}>No due date</span>
              )}
            </span>
          </div>

          <div className="prop-row">
            <span className="prop-label">Created</span>
            <span className="prop-value" style={{ color: 'var(--text-secondary)' }}>
              {formatDateTime(todo.createdAt)}
            </span>
          </div>

          <div className="prop-row">
            <span className="prop-label">Updated</span>
            <span className="prop-value" style={{ color: 'var(--text-secondary)' }}>
              {formatDateTime(todo.updatedAt)}
            </span>
          </div>

          {todo.completedAt && (
            <div className="prop-row">
              <span className="prop-label">Completed</span>
              <span className="prop-value" style={{ color: 'var(--text-secondary)' }}>
                {formatDateTime(todo.completedAt)}
              </span>
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button
            className="btn btn-secondary"
            onClick={() => onToggle(todo.id)}
          >
            {todo.status === 'completed' ? (
              <>
                {Icons.refresh} Reopen
              </>
            ) : (
              <>
                {Icons.check} Complete
              </>
            )}
          </button>
          <button className="btn btn-secondary" onClick={() => onEdit(todo)}>
            {Icons.edit} Edit
          </button>
          <button
            className="btn btn-danger"
            onClick={() => setConfirming(true)}
            disabled={deleting}
          >
            {deleting ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : Icons.trash}
            Delete
          </button>
        </div>
      </aside>

      {confirming && (
        <div className="modal-overlay" style={{ zIndex: 110 }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">Delete task?</h2>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.6 }}>
                &ldquo;{todo.title}&rdquo; will be permanently deleted. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirming(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
