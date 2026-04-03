import React from 'react';
import { NavLink } from 'react-router-dom';

export default function DesktopSidebar({ items, title, logo, onLogout, t }) {
  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">{logo}</span>
        <h2 className="sidebar-title">{title}</h2>
      </div>
      
      <nav className="sidebar-nav">
        {items.map((item) => (
          item.action ? (
            <button 
              key="logout-btn" 
              onClick={item.onClick || onLogout} 
              className="sidebar-item" 
              style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ) : (
            <NavLink 
              key={item.to} 
              to={item.to} 
              end={item.end}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          )
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: 12, color: 'var(--text-light)', padding: '0 8px' }}>
          Daycare Manager v1.1.0
        </div>
      </div>
    </aside>
  );
}
