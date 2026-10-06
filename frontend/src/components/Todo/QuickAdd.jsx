import { useState } from 'react';
import { Icons } from '../../utils/icons.jsx';

export function QuickAdd({ onSubmit, placeholder = 'Add a task...' }) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = value.trim();
    if (!title || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ title });
      setValue('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="quick-add" onSubmit={handleSubmit}>
      <span className="plus-icon">{Icons.plus}</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Quick add task"
        maxLength={200}
      />
      {submitting ? (
        <span className="spinner" style={{ width: 14, height: 14 }} />
      ) : (
        <span className="quick-add-hint">
          <kbd>↵</kbd> to add
        </span>
      )}
    </form>
  );
}
