import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../utils/icons.jsx';

const NAV_ACTIONS = [
  { id: 'nav-inbox', label: 'Go to Inbox', icon: Icons.inbox, hint: 'View', action: () => '/' },
  { id: 'nav-today', label: 'Go to Today', icon: Icons.today, hint: 'View', action: () => '/today' },
  { id: 'nav-upcoming', label: 'Go to Upcoming', icon: Icons.upcoming, hint: 'View', action: () => '/upcoming' },
  { id: 'nav-completed', label: 'Go to Completed', icon: Icons.completed, hint: 'View', action: () => '/completed' },
  { id: 'nav-high', label: 'Go to High Priority', icon: Icons.flag, hint: 'View', action: () => '/high-priority' },
  { id: 'nav-profile', label: 'Go to Profile & Settings', icon: Icons.user, hint: 'View', action: () => '/profile' },
  { id: 'new-task', label: 'Create new task', icon: Icons.plus, hint: 'Action', action: 'new-task' },
  { id: 'toggle-theme', label: 'Toggle light / dark theme', icon: Icons.moon, hint: 'Action', action: 'toggle-theme' },
];

export function CommandPalette({ open, onClose, todos, onNewTask, onOpenTodo, onToggleTheme }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const nav = NAV_ACTIONS.filter((a) => !q || a.label.toLowerCase().includes(q));
    const todoMatches = q
      ? todos.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q)
        )
      : todos.slice(0, 5);
    return { nav, todoMatches };
  }, [query, todos]);

  const flatItems = useMemo(() => {
    const items = [];
    results.nav.forEach((n) => items.push({ type: 'action', ...n }));
    if (results.todoMatches.length) {
      results.todoMatches.forEach((t) => items.push({ type: 'todo', id: `todo-${t.id}`, todo: t }));
    }
    return items;
  }, [results]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex];
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const runItem = (item) => {
    if (item.type === 'todo') {
      onOpenTodo(item.todo);
    } else if (item.action === 'new-task') {
      onNewTask();
    } else if (item.action === 'toggle-theme') {
      onToggleTheme();
    } else {
      navigate(item.action());
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) runItem(flatItems[selectedIndex]);
    }
  };

  let lastGroup = null;

  return (
    <div className="palette-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="palette-input-row">
          {Icons.search}
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Search tasks or run a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Command palette search"
          />
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' }}>
            ESC
          </kbd>
        </div>

        <div className="palette-list" ref={listRef}>
          {flatItems.length === 0 && (
            <div className="palette-empty">No results for &ldquo;{query}&rdquo;</div>
          )}

          {flatItems.map((item, index) => {
            let group = null;
            if (item.type === 'action') group = 'Commands';
            else if (index === results.nav.length) group = 'Tasks';
            const showGroup = group && group !== lastGroup;
            if (showGroup) lastGroup = group;

            return (
              <div key={item.id}>
                {showGroup && <div className="palette-group-label">{group}</div>}
                <button
                  className={`palette-item${index === selectedIndex ? ' selected' : ''}`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => runItem(item)}
                >
                  <span className="palette-item-icon">
                    {item.type === 'todo'
                      ? item.todo.status === 'completed'
                        ? Icons.check
                        : Icons.inbox
                      : item.icon}
                  </span>
                  <span className="palette-item-title">
                    {item.type === 'todo' ? item.todo.title : item.label}
                  </span>
                  {item.type === 'todo' && (
                    <span className={`chip chip-priority-${item.todo.priority}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                      {item.todo.priority}
                    </span>
                  )}
                  {item.type === 'action' && (
                    <span className="palette-item-hint">{item.hint}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="palette-footer">
          <span>
            <kbd>↑↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> select
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
