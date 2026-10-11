import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Tag, MessageSquare, ArrowLeft, Shield } from 'lucide-react';

export const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem', marginBottom: '1.25rem' }}>
          <Shield size={22} color="#fbbf24" />
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fbbf24' }}>Admin Panel</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <Users size={18} />
            <span>Users</span>
          </NavLink>

          <NavLink
            to="/admin/posts"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <FileText size={18} />
            <span>Posts</span>
          </NavLink>

          <NavLink
            to="/admin/tags"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <Tag size={18} />
            <span>Tags & Categories</span>
          </NavLink>

          <NavLink
            to="/admin/comments"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <MessageSquare size={18} />
            <span>Comments</span>
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <Link to="/" className="nav-link" style={{ fontSize: '0.875rem' }}>
            <ArrowLeft size={16} />
            <span>Back to Main Site</span>
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};
