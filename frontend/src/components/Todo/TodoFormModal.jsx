import { useEffect, useState } from 'react';
import { Modal } from '../UI/Modal.jsx';
import { toDateInputValue } from '../../utils/date.js';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function TodoFormModal({ open, onClose, todo, onSubmit, onDelete }) {
  const isEdit = Boolean(todo);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('active');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(todo?.title || '');
      setDescription(todo?.description || '');
      setPriority(todo?.priority || 'medium');
      setDueDate(todo?.dueDate ? toDateInputValue(todo.dueDate) : '');
      setStatus(todo?.status || 'active');
      setErrors({});
    }
  }, [open, todo]);

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required';
    else if (title.trim().length > 200) errs.title = 'Title must be 200 characters or fewer';
    if (description.length > 5000) errs.description = 'Description is too long';
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) errs.dueDate = 'Invalid date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || null,
        ...(isEdit ? { status } : {}),
      });
      onClose();
    } catch (err) {
      if (err.errors?.length) {
        const map = {};
        err.errors.forEach((er) => {
          const key = er.path === 'dueDate' ? 'dueDate' : er.path;
          if (key) map[key] = er.msg;
        });
        setErrors(map);
      } else {
        setErrors({ form: err.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'New task'}
      footer={
        <>
          {isEdit && onDelete ? (
            <button
              className="btn btn-ghost"
              style={{ color: 'var(--danger)', marginRight: 'auto' }}
              onClick={() => {
                onDelete(todo);
                onClose();
              }}
            >
              Delete
            </button>
          ) : null}
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
            {isEdit ? 'Save changes' : 'Create task'}
          </button>
        </>
      }
    >
      {errors.form && <div className="form-error-banner">{errors.form}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field-label" htmlFor="todo-title">Title</label>
          <input
            id="todo-title"
            className={`input${errors.title ? ' invalid' : ''}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            maxLength={200}
            autoFocus
          />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="todo-desc">Description</label>
          <textarea
            id="todo-desc"
            className={`textarea${errors.description ? ' invalid' : ''}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details, notes, or context..."
            maxLength={5000}
            rows={3}
          />
          {errors.description && <span className="field-error">{errors.description}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field">
            <label className="field-label" htmlFor="todo-priority">Priority</label>
            <select
              id="todo-priority"
              className="select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="todo-due">Due date</label>
            <input
              id="todo-due"
              type="date"
              className={`input${errors.dueDate ? ' invalid' : ''}`}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {errors.dueDate && <span className="field-error">{errors.dueDate}</span>}
          </div>
        </div>

        {isEdit && (
          <div className="field">
            <label className="field-label" htmlFor="todo-status">Status</label>
            <select
              id="todo-status"
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        )}
      </form>
    </Modal>
  );
}
