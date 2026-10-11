import React, { useState, useEffect } from 'react';
import { api, getAssetUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { Modal } from './Modal';
import { MessageSquare, Send, Trash2, Edit2, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CommentSection = ({ postId, postAuthorId }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { success, error } = useToast();
  const { socket } = useSocket();

  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data.data.comments || []);
    } catch {}
  };

  const addCommentToState = (incomingComment) => {
    if (!incomingComment) return;
    const incomingId = String(incomingComment._id || incomingComment.id || '');
    if (!incomingId) return;

    setComments((prev) => {
      if (prev.some((c) => String(c._id || c.id || '') === incomingId)) {
        return prev;
      }
      return [incomingComment, ...prev];
    });
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  useEffect(() => {
    if (!socket) return;

    const eventName = `post:${postId}:comment`;
    const handleNewComment = (data) => {
      if (data?.comment) {
        addCommentToState(data.comment);
      }
    };

    socket.on(eventName, handleNewComment);
    return () => socket.off(eventName, handleNewComment);
  }, [socket, postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: content.trim() });
      const newComment = res.data.data.comment;

      addCommentToState(newComment);
      setContent('');
      success('Comment posted successfully');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment._id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const res = await api.patch(`/comments/${commentId}`, { content: editContent.trim() });
      const updated = res.data.data.comment;

      setComments((prev) => prev.map((c) => (String(c._id || c.id) === String(commentId) ? updated : c)));
      handleCancelEdit();
      success('Comment updated');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update comment');
    }
  };

  const confirmDelete = (commentId) => {
    setCommentToDelete(commentId);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!commentToDelete) return;

    try {
      await api.delete(`/comments/${commentToDelete}`);
      setComments((prev) => prev.filter((c) => String(c._id || c.id) !== String(commentToDelete)));
      success('Comment deleted');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete comment');
    } finally {
      setCommentToDelete(null);
    }
  };

  const currentUserId = user?._id || user?.id;

  return (
    <section style={{ marginTop: '3.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <MessageSquare size={22} color="var(--primary)" />
        <h3 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Comments ({comments.length})</h3>
      </div>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Join the discussion... Share your thoughts or questions."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={isSubmitting || !content.trim()} className="btn btn-primary btn-sm">
              <Send size={15} />
              <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Have something to say? Sign in to join the conversation.
          </p>
          <Link to="/login" className="btn btn-primary btn-sm">
            Sign In to Comment
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {comments.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            No comments yet. Be the first to start the discussion!
          </div>
        ) : (
          comments.map((comment) => {
            const authorId = String(comment.author?._id || comment.author?.id || '');
            const loggedInId = String(currentUserId || '');
            const postOwnerId = String(postAuthorId || '');
            const isOwner = Boolean(authorId && loggedInId && authorId === loggedInId);
            const isPostAuthor = Boolean(postOwnerId && loggedInId && postOwnerId === loggedInId);
            const canDelete = isOwner || isPostAuthor || isAdmin;
            const canEdit = isOwner || isAdmin;
            const isEditing = editingCommentId === comment._id;

            return (
              <div key={comment._id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div className="author-chip">
                    <img
                      src={
                        getAssetUrl(comment.author?.avatar) ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(comment.author?.name || 'U')}`
                      }
                      alt={comment.author?.name}
                      className="avatar"
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {comment.author?.name || 'User'}
                        {comment.author?.role === 'admin' && (
                          <span className="badge badge-admin" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                            Admin
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.775rem' }}>
                        {new Date(comment.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {canEdit && !isEditing && (
                      <button
                        onClick={() => handleStartEdit(comment)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                        title="Edit comment"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                    {canDelete && !isEditing && (
                      <button
                        onClick={() => confirmDelete(comment._id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.25rem 0.5rem' }}
                        title="Delete comment"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div>
                    <textarea
                      className="form-textarea"
                      rows="2"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button onClick={handleCancelEdit} className="btn btn-secondary btn-sm">
                        <X size={14} /> Cancel
                      </button>
                      <button onClick={() => handleSaveEdit(comment._id)} className="btn btn-primary btn-sm">
                        <Check size={14} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-main)', fontSize: '0.925rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {comment.content}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        title="Delete Comment"
        message="Are you sure you want to permanently delete this comment? This action cannot be undone."
        confirmText="Delete"
        isDanger={true}
        onConfirm={handleDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
    </section>
  );
};
