import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { PenSquare, Link as LinkIcon, Image, Clock } from 'lucide-react';

export const CreatePost = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [readTime, setReadTime] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await api.get('/tags');
        setAvailableTags(res.data.data.tags || []);
      } catch (err) {
        console.error('Failed to load dynamic tags:', err);
      }
    };
    fetchTags();
  }, []);

  const previewSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});
    setIsSubmitting(true);

    try {
      const res = await api.post('/posts', {
        title: title.trim(),
        content: content.trim(),
        coverImage: coverImage.trim() || undefined,
        tags: selectedTags,
        readTime: Number(readTime) || undefined,
      });

      success('Post published successfully!');
      const newPost = res.data.data.post;
      navigate(`/posts/${newPost.slug}`);
    } catch (err) {
      if (err.response?.data?.errors) {
        const errorMap = {};
        err.response.data.errors.forEach((e) => {
          errorMap[e.field] = e.message;
        });
        setValidationErrors(errorMap);
        error('Please correct the validation errors');
      } else {
        error(err.response?.data?.message || 'Failed to create post');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '1.5rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Write an Article</h1>
        <p className="page-subtitle">Draft and publish a new post.</p>
      </div>

      <form onSubmit={handleSubmit} className="editor-layout-grid">
        <div className="card" style={{ padding: '1.75rem' }}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700 }}>Article Title *</label>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '1.15rem', padding: '0.85rem 1rem', fontWeight: 600 }}
              placeholder="Enter article title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            {title && (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <LinkIcon size={13} />
                <span>Permalink preview: <strong>/posts/{previewSlug || 'your-title'}</strong></span>
              </div>
            )}
            {validationErrors.title && <div className="form-error">{validationErrors.title}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700 }}>Content Body *</label>
            <textarea
              className="form-textarea"
              rows="20"
              style={{ fontSize: '1rem', lineHeight: 1.7, padding: '1rem', minHeight: '440px' }}
              placeholder="Write your article in markdown or plain text..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            {validationErrors.content && <div className="form-error">{validationErrors.content}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              Publishing Settings
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
                placeholder="https://images.unsplash.com/photo-..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
              />
              {coverImage && (
                <div style={{ marginTop: '0.75rem', height: '140px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={coverImage} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.target.style.display = 'none')} />
                </div>
              )}
              {validationErrors.coverImage && <div className="form-error">{validationErrors.coverImage}</div>}
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
                {isSubmitting ? 'Publishing...' : 'Publish Article'}
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
