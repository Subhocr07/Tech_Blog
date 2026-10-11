import React, { useState, useEffect } from 'react';
import { api, getAssetUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { Users, Search, Trash2, Shield, User, CheckCircle, XCircle } from 'lucide-react';

export const UsersManagement = () => {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;

      const res = await api.get('/users', { params });
      setUsers(res.data.data.users || []);
      setPagination(res.data.meta);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      success(`Role updated to ${newRole}`);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await api.patch(`/users/${userId}`, { isActive: !currentStatus });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isActive: !currentStatus } : u)));
      success(`User account ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to change user status');
    }
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      success('User deleted successfully');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setUserToDelete(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage registered user accounts and permissions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.85rem' }}
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              Search
            </button>
          </form>

          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.85rem' }}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Roles</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Provider</th>
              <th>Joined</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading users list...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No users found matching your filters.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isCurrent = (currentUser?._id || currentUser?.id) === u._id;
                return (
                  <tr key={u._id}>
                    <td>
                      <div className="author-chip">
                        <img src={getAssetUrl(u.avatar)} alt={u.name} className="avatar" />
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name} {isCurrent && '(You)'}</div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.775rem' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={u.role}
                        disabled={isCurrent}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="form-select"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => handleStatusToggle(u._id, u.isActive)}
                        disabled={isCurrent}
                        className="btn btn-sm"
                        style={{
                          background: u.isActive ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: u.isActive ? 'var(--success)' : 'var(--danger)',
                          padding: '0.25rem 0.6rem',
                          border: 'none',
                        }}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                    <td>
                      <span className="badge badge-tag" style={{ textTransform: 'capitalize' }}>
                        {u.provider || 'local'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!isCurrent && (
                        <button
                          onClick={() => confirmDelete(u)}
                          className="btn btn-danger btn-sm"
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />

      <Modal
        isOpen={deleteModalOpen}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete "${userToDelete?.name}" (${userToDelete?.email})? All associated posts will also be soft-deleted.`}
        confirmText="Delete User"
        isDanger={true}
        onConfirm={handleDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
