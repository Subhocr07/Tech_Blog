import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { Edit3, Link as LinkIcon, Image, Clock } from 'lucide-react';

export const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [readTime, setReadTime] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slug, setSlug] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [postRes, tagsRes] = await Promise.all([
          api.get(`/posts/${id}`),
          api.get('/tags').catch(() => ({ data: { data: { tags: [] } } })),
        ]);

        const post = postRes.data.data.post;
        setAvailableTags(tagsRes.data?.data?.tags || []);

        const currentUserId = user?._id || user?.id;
        const isAuthor = post.author?._id === currentUserId || post.author?.id === currentUserId;

        if (!isAuthor && !isAdmin) {
          error('You do not have permission to edit this article');
          navigate('/');
          return;
        }

        setTitle(post.title);
        setContent(post.content);
        setCoverImage(post.coverImage || '');
        setSelectedTags(post.tags || []);
        setReadTime(post.readTime || 3);
        setSlug(post.slug);
      } catch (err) {
        error('Failed to load article');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, user, isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await api.patch(`/posts/${id}`, {
        title: title.trim(),
        content: content.trim(),
        coverImage: coverImage.trim() || '',
        tags: selectedTags,
        readTime: Number(readTime) || 3,
      });

      success('Article updated successfully!');
      const updatedPost = res.data.data.post;
      navigate(`/posts/${updatedPost.slug}`);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update article');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading article for editing...
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '1.5rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Edit Article</h1>
        <p className="page-subtitle">Update your article content, tags, or settings.</p>
      </div>

      <form onSubmit={handleSubmit} className="editor-layout-grid">
        <div className="card" style={{ padding: '1.75rem' }}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700 }}>Article Title *</label>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '1.15rem', padding: '0.85rem 1rem', fontWeight: 600 }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700 }}>Content Body *</label>
            <textarea
              className="form-textarea"
              rows="20"
              style={{ fontSize: '1rem', lineHeight: 1.7, padding: '1rem', minHeight: '440px' }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              Article Settings
            </h3>

            <div className="form-group">
              <label className="form-label">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Image size={15} /> Cover Image URL
                </span>
              </label>
              <input
                type="url"
                className="form-input"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
              />
              {coverImage && (
                <div style={{ marginTop: '0.75rem', height: '140px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={coverImage} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.target.style.display = 'none')} />
                </div>
              )}
            </div>

            <div className="form-group">
              <MultiSelectDropdown
                label="Categories & Tags"
                options={availableTags.map((t) => t.name)}
                selected={selectedTags}
                onChange={setSelectedTags}
                placeholder="Select tags..."
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={15} /> Estimated Read Time (min)
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="60"
                className="form-input"
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary" style={{ width: '100%' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
