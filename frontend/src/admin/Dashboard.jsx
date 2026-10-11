import React, { useState, useEffect } from 'react';
import { api, getAssetUrl } from '../services/api';
import { Users, FileText, MessageSquare, Activity, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading administrator metrics...</div>;
  }

  const { stats, recentActivity, recentUsers } = data || {
    stats: { totalUsers: 0, totalPosts: 0, activePosts: 0, deletedPosts: 0, totalComments: 0 },
    recentActivity: [],
    recentUsers: [],
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Platform Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Overview of platform activity and statistics.
        </p>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Total Users</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.totalUsers}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Total Posts</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.totalPosts}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({stats.activePosts} active, {stats.deletedPosts} deleted)</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Total Comments</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.totalComments}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Activity size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Activity Logs</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((log) => (
                <div
                  key={log._id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{log.action}</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    User: {log.userEmail || log.user?.email || 'System/Guest'} (IP: {log.ip})
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No activity records yet.</div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="var(--accent)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>New Registered Users</h2>
            </div>
            <Link to="/admin/users" style={{ color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span>View All</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recentUsers && recentUsers.length > 0 ? (
              recentUsers.map((u) => (
                <div
                  key={u._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="author-chip">
                    <img src={getAssetUrl(u.avatar)} alt={u.name} className="avatar" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.775rem' }}>{u.email}</div>
                    </div>
                  </div>
                  <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>{u.role}</span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No users registered.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
