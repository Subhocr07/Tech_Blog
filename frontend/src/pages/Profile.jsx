import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, getAssetUrl } from '../services/api';
import { Modal } from '../components/Modal';
import {
  User,
  Mail,
  Shield,
  BookOpen,
  Trash2,
  Edit3,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Upload,
  X,
  UserCheck,
} from 'lucide-react';

export const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const { success, error } = useToast();

  const [myPosts, setMyPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Edit Profile Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);

  // Password Change States
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const fileInputRef = useRef(null);

  const fetchMyPosts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const uid = user._id || user.id;
      const res = await api.get('/posts', { params: { author: uid, limit: 50 } });
      setMyPosts(res.data.data.posts || []);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, [user]);

  const handleDeletePost = async () => {
    if (!selectedPostId) return;
    try {
      await api.delete(`/posts/${selectedPostId}`);
      setMyPosts((prev) => prev.filter((p) => p._id !== selectedPostId));
      success('Article deleted successfully');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete article');
    } finally {
      setSelectedPostId(null);
    }
  };

  const handleOpenEditModal = () => {
    setEditName(user?.name || '');
    setEditBio(user?.bio || '');
    setAvatarFile(null);
    setAvatarPreview('');
    setRemoveAvatar(false);
    setChangePassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setProfileError('');
    setEditModalOpen(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Please select a valid image file (JPG, PNG, WEBP, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error('Image size must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    setRemoveAvatar(false);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleResetAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setRemoveAvatar(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');

    if (!editName.trim()) {
      setProfileError('Name cannot be empty');
      return;
    }

    if (changePassword) {
      if (!currentPassword) {
        setProfileError('Current password is required to change password');
        return;
      }
      if (newPassword.length < 6) {
        setProfileError('New password must be at least 6 characters long');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setProfileError('New passwords do not match');
        return;
      }
    }

    setIsSubmittingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', editName.trim());
      formData.append('bio', editBio.trim());

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      } else if (removeAvatar) {
        formData.append(
          'avatar',
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editName.trim())}`
        );
      }

      if (changePassword) {
        formData.append('currentPassword', currentPassword);
        formData.append('newPassword', newPassword);
      }

      const res = await api.patch('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updated = res.data.data.user;
      updateUserProfile(updated);
      success('Profile updated successfully!');
      setEditModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      setProfileError(msg);
      error(msg);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  if (!user) return null;

  const currentAvatarSrc =
    avatarPreview ||
    (removeAvatar
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editName || 'U')}`
      : getAssetUrl(user.avatar) ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'U')}`);

  const displayAvatar =
    getAssetUrl(user.avatar) ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'U')}`;

  return (
    <div className="container" style={{ paddingTop: '1.5rem' }}>
      <div
        className="card"
        style={{
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '2rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={displayAvatar}
              alt={user.name}
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                border: '2px solid var(--border-color)',
                objectFit: 'cover',
                background: 'var(--bg-subtle)',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 700 }}>{user.name}</h1>
              <span
                className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}`}
                style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '0.7rem' }}
              >
                {user.role}
              </span>
            </div>

            {user.bio && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.65rem', maxWidth: '600px', lineHeight: 1.5 }}>
                {user.bio}
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={14} />
                {user.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <BookOpen size={14} />
                {myPosts.length} Articles
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleOpenEditModal} className="btn btn-secondary">
            <Edit3 size={15} />
            <span>Edit Profile</span>
          </button>

          <Link to="/create-post" className="btn btn-primary">
            <BookOpen size={15} />
            <span>Write Article</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Articles</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{myPosts.length}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Read Time</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {myPosts.reduce((acc, p) => acc + (p.readTime || 3), 0)} min
            </div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}>
            <Shield size={20} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Status</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 600, marginTop: '0.15rem', color: 'var(--text-primary)' }}>Active</div>
          </div>
        </div>
      </div>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>My Articles</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage, edit, or delete articles published under your author profile.</p>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>Loading articles...</div>
        ) : myPosts.length === 0 ? (
          <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '1rem' }}>You haven't published any articles yet.</p>
            <Link to="/create-post" className="btn btn-primary btn-sm">
              Create your first article
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myPosts.map((post) => (
              <div
                key={post._id}
                className="card"
                style={{
                  padding: '1.25rem 1.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    <Link to={`/posts/${post.slug}`} style={{ color: 'inherit' }}>
                      {post.title}
                    </Link>
                  </h3>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span>Published on {new Date(post.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{post.readTime || 3} min read</span>
                    {post.tags && post.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          {post.tags.slice(0, 3).map((t, idx) => (
                            <span key={idx} className="badge badge-tag">
                              #{t}
                            </span>
                          ))}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <Link to={`/edit-post/${post._id}`} className="btn btn-secondary btn-sm">
                    <Edit3 size={14} /> Edit
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedPostId(post._id);
                      setDeleteModalOpen(true);
                    }}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Delete Post Modal */}
      <Modal
        isOpen={deleteModalOpen}
        title="Delete Article"
        message="Are you sure you want to delete this article? It will be removed from your profile and public listings."
        confirmText="Delete"
        isDanger={true}
        onConfirm={handleDeletePost}
        onClose={() => setDeleteModalOpen(false)}
      />

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Update Profile</h2>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {profileError && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--danger-subtle)',
                  color: 'var(--danger)',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                }}
              >
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              {/* Profile Photo Upload */}
              <div className="avatar-upload-wrapper">
                <div
                  className="avatar-preview-container"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change profile photo"
                >
                  <img src={currentAvatarSrc} alt="Preview" className="avatar-preview-img" />
                  <div className="avatar-upload-overlay">
                    <Camera size={18} />
                    <span>Upload</span>
                  </div>
                </div>

                <div className="avatar-upload-actions">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Upload size={14} />
                    <span>Upload New Photo</span>
                  </button>

                  {(avatarFile || (!removeAvatar && user.avatar && !user.avatar.includes('dicebear.com')) ) && (
                    <button
                      type="button"
                      onClick={handleResetAvatar}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'left', padding: '2px 0' }}
                    >
                      Reset to Default Avatar
                    </button>
                  )}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    JPG, PNG, WEBP, or GIF (max 5MB)
                  </span>
                </div>
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem' }}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '2.4rem', opacity: 0.65, cursor: 'not-allowed' }}
                    value={user.email}
                    disabled
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem', display: 'block' }}>
                  Email address cannot be changed ({user.provider === 'local' ? 'Account Email' : `Linked with ${user.provider}`}).
                </span>
              </div>

              {/* Bio */}
              <div className="form-group">
                <label className="form-label">Bio / About</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  maxLength={300}
                  placeholder="Share a short bio or intro about your work..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  {editBio.length}/300
                </div>
              </div>

              {/* Password Change Option */}
              {user.provider === 'local' && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: changePassword ? '1rem' : 0 }}>
                    <input
                      type="checkbox"
                      checked={changePassword}
                      onChange={(e) => setChangePassword(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Change Account Password</span>
                  </label>

                  {changePassword && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.75rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Current Password *</label>
                        <div style={{ position: 'relative' }}>
                          <Lock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            className="form-input"
                            style={{ paddingLeft: '2.4rem', paddingRight: '2.5rem' }}
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required={changePassword}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword((prev) => !prev)}
                            className="password-toggle-btn"
                            tabIndex={-1}
                            title={showCurrentPassword ? 'Hide password' : 'Show password'}
                          >
                            {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">New Password *</label>
                        <div style={{ position: 'relative' }}>
                          <Lock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            className="form-input"
                            style={{ paddingLeft: '2.4rem', paddingRight: '2.5rem' }}
                            placeholder="Minimum 6 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required={changePassword}
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="password-toggle-btn"
                            tabIndex={-1}
                            title={showNewPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Confirm New Password *</label>
                        <div style={{ position: 'relative' }}>
                          <Lock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input
                            type={showConfirmNewPassword ? 'text' : 'password'}
                            className="form-input"
                            style={{ paddingLeft: '2.4rem', paddingRight: '2.5rem' }}
                            placeholder="Repeat new password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required={changePassword}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                            className="password-toggle-btn"
                            tabIndex={-1}
                            title={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={isSubmittingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingProfile}
                >
                  {isSubmittingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
