import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAssetUrl } from '../services/api';
import { BookOpen, PenSquare, Shield, LogOut, LogIn } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    success('Logged out');
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <div className="nav-brand-logo">
            <BookOpen size={18} />
          </div>
          <span>DevChronicle</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Articles
          </NavLink>

          {isAuthenticated && (
            <NavLink to="/create-post" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <PenSquare size={15} />
              <span>Write</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Shield size={15} color="#fbbf24" />
              <span>Admin</span>
            </NavLink>
          )}

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
              <Link to="/profile" className="user-nav-chip" title="View Profile">
                <img
                  src={getAssetUrl(user?.avatar) || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'U')}`}
                  alt={user?.name}
                  className="avatar"
                  style={{ width: '28px', height: '28px' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.name?.split(' ')[0]}
                </span>
                {isAdmin && (
                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontWeight: 700 }}>
                    ADMIN
                  </span>
                )}
              </Link>

              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Sign Out">
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={14} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
