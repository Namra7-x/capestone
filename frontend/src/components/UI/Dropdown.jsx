import { useEffect, useRef, useState } from 'react';
import { Icons } from '../../utils/icons.jsx';

export function Dropdown({ trigger, children, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="dropdown" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div className={`dropdown-menu ${align === 'left' ? 'left' : ''}`} role="menu">
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ active, danger, icon, children, onClick, hint }) {
  return (
    <button
      className={`dropdown-item${active ? ' active' : ''}${danger ? ' danger' : ''}`}
      onClick={onClick}
      role="menuitem"
    >
      {icon}
      <span style={{ flex: 1 }}>{children}</span>
      {hint && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{hint}</span>}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="dropdown-separator" />;
}

export function SortButton({ value, onChange, options }) {
  const current = options.find((o) => o.value === value);
  return (
    <Dropdown
      trigger={
        <button className="btn btn-secondary btn-sm">
          {Icons.sort}
          <span>{current?.label || 'Sort'}</span>
          {Icons.chevronDown}
        </button>
      }
    >
      {({ close }) => (
        <>
          {options.map((opt) => (
            <DropdownItem
              key={opt.value}
              active={opt.value === value}
              icon={opt.value === value ? Icons.check : <span style={{ width: 14 }} />}
              onClick={() => {
                onChange(opt.value);
                close();
              }}
            >
              {opt.label}
            </DropdownItem>
          ))}
        </>
      )}
    </Dropdown>
  );
}
