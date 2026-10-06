import { useState } from 'react';
import { Icons } from '../../utils/icons.jsx';
import { dueChipClass, formatDate, isOverdue, isToday } from '../../utils/date.js';

const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };

export function TodoItem({ todo, onToggle, onEdit, onDelete, onOpen, selected }) {
  const [leaving, setLeaving] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    setLeaving(true);
    setTimeout(() => onDelete(todo), 220);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    onToggle(todo.id);
  };

  const overdue = isOverdue(todo.dueDate, todo.status);
  const today = isToday(todo.dueDate);

  return (
    <div
      className={`todo-item${todo.status === 'completed' ? ' completed' : ''}${leaving ? ' leaving' : ''}${selected ? ' selected' : ''}`}
      onClick={() => onOpen(todo)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(todo);
      }}
    >
      <button
        className={`checkbox${todo.status === 'completed' ? ' checked' : ''}`}
        onClick={handleToggle}
        aria-label={todo.status === 'completed' ? 'Reopen task' : 'Complete task'}
        aria-pressed={todo.status === 'completed'}
      >
        {todo.status === 'completed' && <Icons.check />}
      </button>

      <div className="todo-body">
        <div className="todo-title">{todo.title}</div>
        {todo.description && <div className="todo-desc">{todo.description}</div>}
        <div className="todo-meta">
          <span className={`chip chip-priority-${todo.priority}`}>
            {Icons.flag}
            {PRIORITY_LABELS[todo.priority]}
          </span>
          {todo.dueDate && (
            <span className={dueChipClass(todo.dueDate, todo.status)}>
              {Icons.calendar}
              {today ? 'Today' : overdue ? 'Overdue' : formatDate(todo.dueDate)}
            </span>
          )}
          {todo.status === 'completed' && (
            <span className="chip chip-status-completed">{Icons.check}Done</span>
          )}
        </div>
      </div>

      <div className="todo-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="icon-btn"
          onClick={() => onEdit(todo)}
          aria-label="Edit task"
          title="Edit"
        >
          {Icons.edit}
        </button>
        <button className="icon-btn" onClick={handleDelete} aria-label="Delete task" title="Delete">
          {Icons.trash}
        </button>
      </div>
    </div>
  );
}
