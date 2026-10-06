import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Icons } from '../../utils/icons.jsx';

export function TopBar({ onOpenSearch, onOpenPalette, onOpenMenu, onRefresh, refreshing }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onOpenMenu} aria-label="Open navigation">
        {Icons.menu}
      </button>

      <button className="search-trigger" onClick={onOpenPalette} aria-label="Search or run command">
        {Icons.search}
        <span>Search or command...</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="topbar-spacer" />

      <button
        className="icon-btn"
        onClick={onRefresh}
        aria-label="Refresh tasks"
        title="Refresh"
        style={refreshing ? { animation: 'spin 0.7s linear infinite' } : undefined}
      >
        {Icons.refresh}
      </button>

      <button
        className="icon-btn"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title="Toggle theme"
      >
        {theme === 'dark' ? Icons.sun : Icons.moon}
      </button>
    </header>
  );
}

export function MobileNav({ current }) {
  const items = [
    { to: '/', label: 'Inbox', icon: Icons.inbox, key: 'inbox' },
    { to: '/today', label: 'Today', icon: Icons.today, key: 'today' },
    { to: '/upcoming', label: 'Upcoming', icon: Icons.upcoming, key: 'upcoming' },
    { to: '/completed', label: 'Done', icon: Icons.completed, key: 'completed' },
    { to: '/profile', label: 'Profile', icon: Icons.user, key: 'profile' },
  ];

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-items">
        {items.map((item) => {
          const active =
            item.key === 'profile'
              ? current === '/profile'
              : current === item.to || (item.key === 'inbox' && current === '/');
          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={`mobile-nav-item${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
