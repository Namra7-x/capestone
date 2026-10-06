import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const VIEWS = {
  inbox: { status: 'active', sort: 'created_desc' },
  today: { status: 'active', sort: 'due_asc' },
  upcoming: { status: 'active', sort: 'due_asc', due: 'upcoming' },
  completed: { status: 'completed', sort: 'updated_desc' },
  high: { status: 'active', priority: 'high', sort: 'created_desc' },
};

export function useTodos(view = 'inbox') {
  const { token } = useAuth();
  const { toast } = useToast();
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(VIEWS[view]?.sort || 'created_desc');
  const requestSeq = useRef(0);

  const baseFilters = useMemo(() => ({ ...(VIEWS[view] || VIEWS.inbox) }), [view]);

  const fetchTodos = useCallback(
    async (silent = false) => {
      const seq = ++requestSeq.current;
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (baseFilters.status) params.set('status', baseFilters.status);
        if (baseFilters.priority) params.set('priority', baseFilters.priority);
        if (baseFilters.due) params.set('due', baseFilters.due);
        if (search.trim()) params.set('search', search.trim());
        params.set('sort', sort);
        const [todoData, statData] = await Promise.all([
          api.get(`/todos?${params.toString()}`, token),
          api.get('/todos/stats', token),
        ]);
        if (seq !== requestSeq.current) return;
        setTodos(todoData.todos);
        setStats(statData);
      } catch (err) {
        if (seq !== requestSeq.current) return;
        setError(err.message);
        if (!silent) toast.error(err.message);
      } finally {
        if (seq === requestSeq.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [token, baseFilters, search, sort, toast]
  );

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const createTodo = useCallback(
    async (data) => {
      const todo = await api.post('/todos', data, token);
      setTodos((prev) => [todo, ...prev]);
      setStats((prev) =>
        prev
          ? {
              ...prev,
              total: prev.total + 1,
              active: prev.active + 1,
              highPriority: data.priority === 'high' ? prev.highPriority + 1 : prev.highPriority,
            }
          : prev
      );
      return todo;
    },
    [token]
  );

  const updateTodo = useCallback(
    async (id, data) => {
      const updated = await api.put(`/todos/${id}`, data, token);
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    },
    [token]
  );

  const toggleTodo = useCallback(
    async (id) => {
      const target = todos.find((t) => t.id === id);
      if (!target) return;
      const nextStatus = target.status === 'completed' ? 'active' : 'completed';
      // Optimistic update
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: nextStatus, completedAt: nextStatus === 'completed' ? new Date().toISOString() : null }
            : t
        )
      );
      setStats((prev) =>
        prev
          ? {
              ...prev,
              active: prev.active + (nextStatus === 'active' ? 1 : -1),
              completed: prev.completed + (nextStatus === 'completed' ? 1 : -1),
            }
          : prev
      );
      try {
        await api.patch(`/todos/${id}/toggle`, {}, token);
      } catch (err) {
        // Rollback
        setTodos((prev) => prev.map((t) => (t.id === id ? target : t)));
        toast.error(err.message);
      }
    },
    [token, todos, toast]
  );

  const deleteTodo = useCallback(
    async (id) => {
      const target = todos.find((t) => t.id === id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      if (target) {
        setStats((prev) =>
          prev
            ? {
                ...prev,
                total: Math.max(0, prev.total - 1),
                active: target.status === 'active' ? Math.max(0, prev.active - 1) : prev.active,
                completed: target.status === 'completed' ? Math.max(0, prev.completed - 1) : prev.completed,
                highPriority: target.priority === 'high' ? Math.max(0, prev.highPriority - 1) : prev.highPriority,
              }
            : prev
        );
      }
      try {
        await api.delete(`/todos/${id}`, token);
      } catch (err) {
        if (target) setTodos((prev) => [target, ...prev]);
        toast.error(err.message);
        throw err;
      }
    },
    [token, todos, toast]
  );

  return {
    todos,
    stats,
    loading,
    refreshing,
    error,
    search,
    setSearch,
    sort,
    setSort,
    fetchTodos,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
  };
}
