import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, getAssetUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CommentSection } from '../components/CommentSection';
import { Modal } from '../components/Modal';
import { Clock, Calendar, Edit3, Trash2, ArrowLeft, Shield } from 'lucide-react';

export const PostDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/posts/slug/${slug}`);
        setPost(res.data.data.post);
      } catch (err) {
        error(err.response?.data?.message || 'Article not found');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleDeletePost = async () => {
    try {
      await api.delete(`/posts/${post._id}`);
      success('Post deleted successfully');
      navigate('/');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete post');
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading article details...
      </div>
    );
  }

  if (!post) return null;

  const currentUserId = user?._id || user?.id;
  const isAuthor = post.author?._id === currentUserId || post.author?.id === currentUserId;
  const canModify = isAuthor || isAdmin;

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="container" style={{ paddingTop: '2.5rem' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
        <ArrowLeft size={16} />
        <span>Back to Articles</span>
      </Link>

      <header style={{ marginBottom: '2.5rem' }}>
        {post.tags && post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {post.tags.map((t, idx) => (
              <span key={idx} className="badge badge-tag">
                #{t}
              </span>
            ))}
          </div>
        )}

        <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.25rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
          {post.title}
        </h1>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
          <div className="author-chip">
            <img
              src={
                getAssetUrl(post.author?.avatar) ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.author?.name || 'U')}`
              }
              alt={post.author?.name}
              className="avatar"
              style={{ width: '46px', height: '46px' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>{post.author?.name || 'Anonymous'}</span>
                {post.author?.role === 'admin' && (
                  <span className="badge badge-admin" style={{ fontSize: '0.65rem' }}>
                    Admin
                  </span>
                )}
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.15rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={13} />
                  {formattedDate}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={13} />
                  {post.readTime || 3} min read
                </span>
              </div>
            </div>
          </div>

          {canModify && (
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <Link to={`/edit-post/${post._id}`} className="btn btn-secondary btn-sm">
                <Edit3 size={15} />
                <span>Edit</span>
              </Link>
              <button onClick={() => setDeleteModalOpen(true)} className="btn btn-danger btn-sm">
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {post.coverImage && (
        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '400px', width: '100%', marginBottom: '2.5rem', border: '1px solid var(--border-color)' }}>
          <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div className="post-layout-grid">
        <div>
          <div
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.8,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              marginBottom: '3rem',
            }}
          >
            {post.content}
          </div>

          <CommentSection postId={post._id} postAuthorId={post.author?._id || post.author?.id} />
        </div>

        <aside style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <img
                src={
                  getAssetUrl(post.author?.avatar) ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.author?.name || 'U')}`
                }
                alt={post.author?.name}
                style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--border-color)' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{post.author?.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Author</div>
              </div>
            </div>
            {post.author?.role === 'admin' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--warning-subtle)', color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.5rem' }}>
                <Shield size={12} />
                <span>Administrator</span>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
              Post Information
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Published</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formattedDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Read Time</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{post.readTime || 3} min</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tags</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{post.tags?.length || 0}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        title="Delete Article"
        message="Are you sure you want to delete this article? It will be soft-deleted and removed from public listings."
        confirmText="Delete Article"
        isDanger={true}
        onConfirm={handleDeletePost}
        onClose={() => setDeleteModalOpen(false)}
      />
    </article>
  );
};
