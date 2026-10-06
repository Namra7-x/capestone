import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Icons } from '../utils/icons.jsx';

export function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    const { username, email, password } = form;

    if (!username.trim()) errs.username = 'Username is required';
    else if (username.trim().length < 3) errs.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
      errs.username = 'Only letters, numbers, and underscores';

    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';

    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(password)) errs.password = 'Add an uppercase letter';
    else if (!/[a-z]/.test(password)) errs.password = 'Add a lowercase letter';
    else if (!/[0-9]/.test(password)) errs.password = 'Add a number';

    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), password);
      toast.success('Account created — welcome to Flowboard!');
      navigate('/', { replace: true });
    } catch (err) {
      if (err.errors?.length) {
        const map = {};
        err.errors.forEach((er) => {
          if (er.path) map[er.path] = er.msg;
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">F</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Flowboard</span>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start organizing your work in seconds.</p>

        {errors.form && <div className="form-error-banner">{errors.form}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field-label" htmlFor="username">Username</label>
            <input
              id="username"
              className={`input${errors.username ? ' invalid' : ''}`}
              value={form.username}
              onChange={set('username')}
              placeholder="jane_doe"
              autoComplete="username"
              autoFocus
              maxLength={50}
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={`input${errors.email ? ' invalid' : ''}`}
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`input${errors.password ? ' invalid' : ''}`}
                value={form.password}
                onChange={set('password')}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? Icons.eyeOff : Icons.eye}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
            <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
              Use 8+ characters with upper, lower, and a number.
            </span>
          </div>

          <button className="btn btn-primary btn-lg btn-block" disabled={submitting}>
            {submitting && <span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} />}
            Create account
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
