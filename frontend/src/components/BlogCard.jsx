import React from 'react';
import { Link } from 'react-router-dom';
import { getAssetUrl } from '../services/api';
import { Clock, Calendar, ArrowRight } from 'lucide-react';

export const BlogCard = ({ post }) => {
  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <article className="blog-card">
      <Link to={`/posts/${post.slug}`} className="card-img-wrapper" tabIndex={-1}>
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} className="card-img" loading="lazy" />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '1.75rem',
              fontWeight: 700,
            }}
          >
            {post.title?.charAt(0) || 'P'}
          </div>
        )}
      </Link>

      <div className="card-body">
        {post.tags && post.tags.length > 0 && (
          <div className="card-tags">
            {post.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="badge badge-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <h3 className="card-title">
          <Link to={`/posts/${post.slug}`} style={{ color: 'inherit' }}>
            {post.title}
          </Link>
        </h3>

        <p className="card-excerpt">{post.content}</p>

        <div className="card-footer">
          <div className="author-chip">
            <img
              src={
                getAssetUrl(post.author?.avatar) ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.author?.name || 'U')}`
              }
              alt={post.author?.name}
              className="avatar"
            />
            <span style={{ fontWeight: 600 }}>{post.author?.name || 'Anonymous'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={14} />
              {post.readTime || 3}m
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={14} />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
