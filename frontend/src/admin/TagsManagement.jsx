import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Tag as TagIcon, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/Modal';

export const TagsManagement = () => {
  const { success, error } = useToast();
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/tags');
      setTags(res.data.data.tags || []);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setIsCreating(true);
    try {
      const res = await api.post('/tags', { name: newTagName.trim() });
      const createdTag = res.data.data.tag;
      setTags((prev) => [...prev, createdTag].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTagName('');
      success(`Tag "#${createdTag.name}" created successfully`);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create tag');
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDelete = (tag) => {
    setTagToDelete(tag);
    setDeleteModalOpen(true);
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      await api.delete(`/tags/${tagToDelete._id}`);
      setTags((prev) => prev.filter((t) => t._id !== tagToDelete._id));
      success(`Tag "#${tagToDelete.name}" deleted`);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete tag');
    } finally {
      setTagToDelete(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          Categories & Tags Management
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Manage tags used to categorize articles.
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Plus size={18} color="var(--primary)" />
          <span>Add New Category / Tag</span>
        </h3>

        <form onSubmit={handleCreateTag} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <TagIcon
              size={15}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="e.g., devops, kubernetes, ai, graphql"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isCreating || !newTagName.trim()}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} />
            <span>{isCreating ? 'Adding...' : 'Add Tag'}</span>
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            Active System Tags ({tags.length})
          </h3>
        </div>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading tags...
          </div>
        ) : tags.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No tags found. Add your first tag above.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {tags.map((tag) => (
              <div
                key={tag._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255, 255, 255, 0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <TagIcon size={14} color="var(--primary)" />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>#{tag.name}</span>
                </div>

                <button
                  type="button"
                  onClick={() => confirmDelete(tag)}
                  className="btn btn-danger btn-sm"
                  style={{ padding: '0.25rem 0.45rem' }}
                  title="Delete tag"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        title="Delete Tag"
        message={`Are you sure you want to delete tag "#${tagToDelete?.name}"? Existing articles with this tag will retain their text.`}
        confirmText="Delete Tag"
        isDanger={true}
        onConfirm={handleDeleteTag}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
