import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, getAssetUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { MessageSquare, Search, Trash2, ExternalLink } from 'lucide-react';

export const CommentsManagement = () => {
  const { success, error } = useToast();

  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  const fetchAdminComments = async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/admin/comments', { params });
      setComments(res.data.data.comments || []);
      setPagination(res.data.meta);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to fetch comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminComments();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAdminComments();
  };

  const handleDelete = async () => {
    if (!commentToDelete) return;
    try {
      await api.delete(`/admin/comments/${commentToDelete._id}`);
      setComments((prev) => prev.filter((c) => c._id !== commentToDelete._id));
      success('Comment removed');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete comment');
    } finally {
      setCommentToDelete(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Comment Moderation</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Review and manage comments across articles.
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.85rem' }}
              placeholder="Search comment text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
        </form>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Author</th>
              <th>Comment Content</th>
              <th>Associated Article</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading comments...
                </td>
              </tr>
            ) : comments.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No comments found.
                </td>
              </tr>
            ) : (
              comments.map((comment) => (
                <tr key={comment._id}>
                  <td>
                    <div className="author-chip">
                      <img src={getAssetUrl(comment.author?.avatar)} alt={comment.author?.name} className="avatar" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{comment.author?.name || 'Deleted'}</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{comment.author?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {comment.content}
                    </div>
                  </td>
                  <td>
                    {comment.post ? (
                      <Link
                        to={`/posts/${comment.post.slug}`}
                        target="_blank"
                        style={{ color: 'var(--primary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <span>{comment.post.title}</span>
                        <ExternalLink size={12} />
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Post Removed</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setCommentToDelete(comment);
                        setDeleteModalOpen(true);
                      }}
                      className="btn btn-danger btn-sm"
                      title="Delete Comment"
                    >
                      <Trash2 size={14} />
                    </button>
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
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        isDanger={true}
        onConfirm={handleDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
