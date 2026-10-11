import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, getAssetUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { SortDropdown } from '../components/SortDropdown';
import { DateFilterDropdown } from '../components/DateFilterDropdown';
import { FileText, Search, Edit3, Trash2, RotateCcw, ExternalLink, X } from 'lucide-react';

export const PostsManagement = () => {
  const { success, error } = useToast();

  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('last_created');
  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToSoftDelete, setPostToSoftDelete] = useState(null);

  const fetchAdminPosts = async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: 10, status: statusFilter };
      if (search.trim()) params.search = search.trim();
      if (sortBy) params.sortBy = sortBy;
      if (datePreset && datePreset !== 'all') params.datePreset = datePreset;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/admin/posts', { params });
      setPosts(res.data.data.posts || []);
      setPagination(res.data.meta);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to fetch posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminPosts();
  }, [page, statusFilter, sortBy, datePreset, startDate, endDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAdminPosts();
  };

  const handleSoftDelete = async () => {
    if (!postToSoftDelete) return;
    try {
      await api.delete(`/posts/${postToSoftDelete._id}`);
      setPosts((prev) =>
        prev.map((p) => (p._id === postToSoftDelete._id ? { ...p, isDeleted: true, deletedAt: new Date() } : p))
      );
      success('Post soft-deleted successfully');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to soft delete post');
    } finally {
      setPostToSoftDelete(null);
    }
  };

  const handleRestore = async (postId) => {
    try {
      await api.patch(`/posts/${postId}/restore`);
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, isDeleted: false, deletedAt: null } : p))
      );
      success('Post restored successfully');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to restore post');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Post Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage, edit, or delete articles across the platform.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.2rem', paddingRight: search ? '2rem' : '0.75rem', fontSize: '0.85rem' }}
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  style={{
                    position: 'absolute',
                    right: '0.55rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                  }}
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              Search
            </button>
          </form>

          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.85rem' }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Posts</option>
            <option value="active">Active Only</option>
            <option value="deleted">Soft-Deleted Only</option>
          </select>

          <SortDropdown
            value={sortBy}
            onChange={(val) => {
              setSortBy(val);
              setPage(1);
            }}
          />

          <DateFilterDropdown
            datePreset={datePreset}
            startDate={startDate}
            endDate={endDate}
            onChange={({ datePreset: p, startDate: s, endDate: e }) => {
              setDatePreset(p);
              setStartDate(s);
              setEndDate(e);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading articles...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No articles found.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{post.title}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.775rem' }}>/{post.slug}</div>
                  </td>
                  <td>
                    <div className="author-chip">
                      <img src={getAssetUrl(post.author?.avatar)} alt={post.author?.name} className="avatar" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{post.author?.name}</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{post.author?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {post.isDeleted ? (
                      <span className="badge badge-deleted">Soft-Deleted</span>
                    ) : (
                      <span className="badge badge-user">Active</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <Link
                        to={`/posts/${post.slug}`}
                        className="btn btn-secondary btn-sm"
                        title="View Public Post"
                        target="_blank"
                      >
                        <ExternalLink size={14} />
                      </Link>

                      <Link
                        to={`/edit-post/${post._id}`}
                        className="btn btn-secondary btn-sm"
                        title="Edit Article"
                      >
                        <Edit3 size={14} />
                      </Link>

                      {post.isDeleted ? (
                        <button
                          onClick={() => handleRestore(post._id)}
                          className="btn btn-sm"
                          style={{ background: 'var(--success-bg)', color: 'var(--success)', border: 'none' }}
                          title="Restore Post"
                        >
                          <RotateCcw size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setPostToSoftDelete(post);
                            setDeleteModalOpen(true);
                          }}
                          className="btn btn-danger btn-sm"
                          title="Soft Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />

      <Modal
        isOpen={deleteModalOpen}
        title="Soft Delete Article"
        message={`Are you sure you want to soft delete "${postToSoftDelete?.title}"? It can be restored later.`}
        confirmText="Soft Delete"
        isDanger={true}
        onConfirm={handleSoftDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
