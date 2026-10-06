import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useTodos } from '../hooks/useTodos.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { Sidebar } from '../components/Layout/Sidebar.jsx';
import { TopBar, MobileNav } from '../components/Layout/TopBar.jsx';
import { QuickAdd } from '../components/Todo/QuickAdd.jsx';
import { TodoList } from '../components/Todo/TodoList.jsx';
import { TodoFormModal } from '../components/Todo/TodoFormModal.jsx';
import { TodoDetailDrawer } from '../components/Todo/TodoDetailDrawer.jsx';
import { CommandPalette } from '../components/CommandPalette.jsx';
import { SortButton } from '../components/UI/Dropdown.jsx';
import { EmptyState, StatsSkeleton } from '../components/UI/EmptyState.jsx';
import { Icons } from '../utils/icons.jsx';
import { isOverdue, isToday } from '../utils/date.js';

const VIEW_META = {
  inbox: { title: 'Inbox', subtitle: 'All your active tasks in one place' },
  today: { title: 'Today', subtitle: 'What is due today or overdue' },
  upcoming: { title: 'Upcoming', subtitle: 'Tasks with an upcoming due date' },
  completed: { title: 'Completed', subtitle: 'Tasks you have finished' },
  high: { title: 'High Priority', subtitle: 'Tasks that need urgent attention' },
};

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Recently created' },
  { value: 'created_asc', label: 'Oldest first' },
  { value: 'updated_desc', label: 'Recently updated' },
  { value: 'due_asc', label: 'Due date (soonest)' },
  { value: 'due_desc', label: 'Due date (latest)' },
  { value: 'priority_desc', label: 'Priority (high first)' },
  { value: 'title_asc', label: 'Title (A–Z)' },
];

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    const duration = 450;
    let raf;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span>{display}</span>;
}

function StatsCards({ stats }) {
  if (!stats) return <StatsSkeleton />;
  const completion = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  const cards = [
    { label: 'Active', value: stats.active, bar: 'stat-accent', width: stats.total ? (stats.active / stats.total) * 100 : 0 },
    { label: 'Completed', value: stats.completed, bar: 'stat-success', width: completion },
    { label: 'High Priority', value: stats.highPriority, bar: 'stat-danger', width: stats.total ? (stats.highPriority / stats.total) * 100 : 0 },
    { label: 'Due Today', value: stats.dueToday + stats.overdue, bar: 'stat-warning', width: stats.total ? ((stats.dueToday + stats.overdue) / stats.total) * 100 : 0 },
  ];

  return (
    <div className="stats-grid">
      {cards.map((c) => (
        <div className="stat-card" key={c.label}>
          <div className="stat-label">{c.label}</div>
          <div className="stat-value">
            <AnimatedNumber value={c.value} />
          </div>
          <div className={`stat-bar ${c.bar}`} style={{ width: `${Math.max(c.width, c.value ? 8 : 0)}%` }} />
        </div>
      ))}
    </div>
  );
}

export function DashboardPage({ view = 'inbox' }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    todos,
    stats,
    loading,
    refreshing,
    error,
    sort,
    setSort,
    fetchTodos,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    setSearch,
  } = useTodos(view);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [detailTodo, setDetailTodo] = useState(null);
  const [deletingTodo, setDeletingTodo] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const debouncedSearch = useDebounce(searchInput, 300);

  // Sync debounced search to the data hook (server-side search)
  useEffect(() => {
    setSearch(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (paletteOpen || formOpen) return;
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !isTyping(e)) {
        setFormOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, formOpen]);

  const isTyping = (e) => {
    const tag = e.target?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable;
  };

  // Today view: show active todos due today or overdue (client-side refinement)
  const visibleTodos = useMemo(() => {
    if (view !== 'today') return todos;
    return todos.filter((t) => {
      if (t.status !== 'active') return false;
      if (!t.dueDate) return false;
      return isToday(t.dueDate) || isOverdue(t.dueDate, t.status);
    });
  }, [view, todos]);

  const meta = VIEW_META[view] || VIEW_META.inbox;

  const handleNewTask = () => {
    setEditingTodo(null);
    setFormOpen(true);
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setFormOpen(true);
  };

  const handleDeleteClick = (todo) => {
    setDeletingTodo(todo);
    setConfirmDelete(true);
  };

  const handleDelete = async (todo) => {
    await deleteTodo(todo.id);
    toast.success('Task deleted');
  };

  const handleFormSubmit = async (data) => {
    if (editingTodo) {
      await updateTodo(editingTodo.id, data);
      toast.success('Task updated');
    } else {
      await createTodo(data);
      toast.success('Task created');
    }
  };

  const handleToggle = async (id) => {
    const target = todos.find((t) => t.id === id);
    await toggleTodo(id);
    if (target) {
      toast.success(
        target.status === 'completed' ? 'Task reopened' : 'Task completed'
      );
    }
  };

  const emptyConfig = {
    inbox: {
      icon: Icons.inbox,
      title: searchInput ? 'No matching tasks' : 'Inbox zero',
      description: searchInput
        ? 'No tasks match your search. Try a different query.'
        : 'Your inbox is empty. Add a task below to get started.',
    },
    today: {
      icon: Icons.today,
      title: 'Nothing due today',
      description: 'No tasks are due today or overdue. Enjoy the calm.',
    },
    upcoming: {
      icon: Icons.upcoming,
      title: 'Nothing upcoming',
      description: 'No tasks with upcoming due dates. Set a due date to plan ahead.',
    },
    completed: {
      icon: Icons.completed,
      title: 'Nothing completed yet',
      description: 'Completed tasks will appear here. Go finish something!',
    },
    high: {
      icon: Icons.flag,
      title: 'No high priority tasks',
      description: 'No urgent tasks. Mark a task as high priority when it matters.',
    },
  }[view] || {};

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        counts={{
          inbox: stats?.active || 0,
          today: (stats?.dueToday || 0) + (stats?.overdue || 0),
          high: stats?.highPriority || 0,
        }}
      />

      <div className="main-area">
        <TopBar
          onOpenMenu={() => setSidebarOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
          onRefresh={() => fetchTodos(true)}
          refreshing={refreshing}
        />

        <main className="page-content">
          <div className="page-header">
            <h1 className="page-title">{meta.title}</h1>
            <p className="page-subtitle">{meta.subtitle}</p>
          </div>

          <StatsCards stats={stats} />

          <QuickAdd onSubmit={handleFormSubmit} placeholder="Add a task and press Enter..." />

          <div className="toolbar">
            <div className="search-trigger" style={{ maxWidth: 260, cursor: 'text' }}>
              {Icons.search}
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search tasks..."
                aria-label="Search tasks"
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, padding: 0, minWidth: 0 }}
              />
              {searchInput && (
                <button
                  className="icon-btn"
                  style={{ width: 20, height: 20 }}
                  onClick={() => setSearchInput('')}
                  aria-label="Clear search"
                >
                  {Icons.x}
                </button>
              )}
            </div>

            <div className="toolbar-spacer" />

            <SortButton value={sort} onChange={setSort} options={SORT_OPTIONS} />

            <button className="btn btn-primary btn-sm" onClick={handleNewTask}>
              {Icons.plus} New task
            </button>
          </div>

          <TodoList
            todos={visibleTodos}
            loading={loading}
            error={error}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onOpen={setDetailTodo}
            selectedId={detailTodo?.id}
            emptyIcon={emptyConfig.icon}
            emptyTitle={emptyConfig.title}
            emptyDescription={emptyConfig.description}
            onRetry={() => fetchTodos()}
            emptyAction={
              !searchInput ? (
                <button className="btn btn-primary" onClick={handleNewTask}>
                  {Icons.plus} Create your first task
                </button>
              ) : null
            }
          />
        </main>

        <MobileNav current={view === 'high' ? '/high-priority' : `/${view === 'inbox' ? '' : view}`} />
      </div>

      <TodoFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        todo={editingTodo}
        onSubmit={handleFormSubmit}
        onDelete={(t) => {
          setFormOpen(false);
          handleDeleteClick(t);
        }}
      />

      <TodoDetailDrawer
        todo={detailTodo}
        onClose={() => setDetailTodo(null)}
        onToggle={handleToggle}
        onEdit={(t) => {
          setDetailTodo(null);
          handleEdit(t);
        }}
        onDelete={handleDelete}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        todos={todos}
        onNewTask={handleNewTask}
        onOpenTodo={setDetailTodo}
        onToggleTheme={toggleTheme}
      />

      {confirmDelete && deletingTodo && (
        <div className="modal-overlay" style={{ zIndex: 130 }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">Delete task?</h2>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.6 }}>
                &ldquo;{deletingTodo.title}&rdquo; will be permanently deleted. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  setConfirmDelete(false);
                  await handleDelete(deletingTodo);
                  setDeletingTodo(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
