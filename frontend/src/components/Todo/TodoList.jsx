import { TodoItem } from './TodoItem.jsx';
import { EmptyState, TodoSkeleton } from '../UI/EmptyState.jsx';
import { Icons } from '../../utils/icons.jsx';

export function TodoList({
  todos,
  loading,
  error,
  onToggle,
  onEdit,
  onDelete,
  onOpen,
  selectedId,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onRetry,
}) {
  if (loading) return <TodoSkeleton />;

  if (error) {
    return (
      <EmptyState
        icon={Icons.alertCircle}
        title="Something went wrong"
        description={error}
        action={
          <button className="btn btn-secondary" onClick={onRetry}>
            {Icons.refresh} Try again
          </button>
        }
      />
    );
  }

  if (!todos.length) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="todo-list" role="list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpen={onOpen}
          selected={todo.id === selectedId}
        />
      ))}
    </div>
  );
}
