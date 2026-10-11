import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { BlogCard } from '../components/BlogCard';
import { Pagination } from '../components/Pagination';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { SortDropdown } from '../components/SortDropdown';
import { DateFilterDropdown } from '../components/DateFilterDropdown';
import { Search, X } from 'lucide-react';

export const Home = () => {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('last_created');
  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: 6 };
      if (activeSearch.trim()) params.search = activeSearch.trim();
      if (selectedTags.length > 0) params.tag = selectedTags.join(',');
      if (sortBy) params.sortBy = sortBy;
      if (datePreset && datePreset !== 'all') params.datePreset = datePreset;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/posts', { params });
      setPosts(res.data.data.posts || []);
      setPagination(res.data.meta);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, selectedTags, sortBy, datePreset, startDate, endDate, activeSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(search.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setActiveSearch('');
    setPage(1);
  };

  const handleTagsChange = (newTags) => {
    setSelectedTags(newTags);
    setPage(1);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPage(1);
  };

  const handleDateChange = ({ datePreset: p, startDate: s, endDate: e }) => {
    setDatePreset(p);
    setStartDate(s);
    setEndDate(e);
    setPage(1);
  };

  const handleResetAllFilters = () => {
    setSearch('');
    setActiveSearch('');
    setSelectedTags([]);
    setSortBy('last_created');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    activeSearch ||
    search.trim() ||
    selectedTags.length > 0 ||
    sortBy !== 'last_created' ||
    (datePreset && datePreset !== 'all') ||
    startDate ||
    endDate
  );

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Articles</h1>
      </div>

      <div className="search-filter-section">
        <div className="search-filter-bar">
          <form onSubmit={handleSearchSubmit} className="search-input-container">
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input-field"
              placeholder="Search articles by title, topic, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search ? (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
                title="Clear search text"
              >
                <X size={14} />
              </button>
            ) : (
              <span
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.72rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                /
              </span>
            )}
          </form>

          <div className="filter-actions-group">
            <MultiSelectDropdown
              options={availableTags.map((t) => t.name)}
              selected={selectedTags}
              onChange={handleTagsChange}
              isFilter={true}
            />

            <SortDropdown
              value={sortBy}
              onChange={handleSortChange}
            />

            <DateFilterDropdown
              datePreset={datePreset}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
            />
          </div>
        </div>

        {availableTags.length > 0 && (
          <div className="category-pills-row">
            <button
              type="button"
              className={`category-pill ${selectedTags.length === 0 ? 'active' : ''}`}
              onClick={() => handleTagsChange([])}
            >
              All Articles
            </button>
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.name);
              return (
                <button
                  key={tag._id || tag.name}
                  type="button"
                  className={`category-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    if (isSelected) {
                      handleTagsChange(selectedTags.filter((t) => t !== tag.name));
                    } else {
                      handleTagsChange([...selectedTags, tag.name]);
                    }
                  }}
                >
                  <span>#{tag.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="active-filters-bar">
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.25rem' }}>
            Active filters:
          </span>

          {activeSearch && (
            <span className="filter-chip">
              <Search size={12} />
              <span>"{activeSearch}"</span>
              <span className="filter-chip-clear" onClick={handleClearSearch} title="Clear search">
                <X size={12} />
              </span>
            </span>
          )}

          {selectedTags.map((tag) => (
            <span key={tag} className="filter-chip">
              <span>#{tag}</span>
              <span
                className="filter-chip-clear"
                onClick={() => handleTagsChange(selectedTags.filter((t) => t !== tag))}
                title={`Remove #${tag}`}
              >
                <X size={12} />
              </span>
            </span>
          ))}

          {sortBy !== 'last_created' && (
            <span className="filter-chip">
              <span>Sort: {sortBy === 'first_created' ? 'First created' : sortBy === 'a_z' ? 'A-Z' : 'Z-A'}</span>
              <span className="filter-chip-clear" onClick={() => handleSortChange('last_created')} title="Reset sort">
                <X size={12} />
              </span>
            </span>
          )}

          {datePreset && datePreset !== 'all' && (
            <span className="filter-chip">
              <span>Date: {datePreset === 'week' ? 'Past 7 Days' : datePreset === 'month' ? 'Past 30 Days' : datePreset === 'today' ? 'Today' : 'This Year'}</span>
              <span className="filter-chip-clear" onClick={() => handleDateChange({ datePreset: 'all', startDate: '', endDate: '' })} title="Clear date filter">
                <X size={12} />
              </span>
            </span>
          )}

          {(startDate || endDate) && (
            <span className="filter-chip">
              <span>Date: {startDate || '...'} → {endDate || '...'}</span>
              <span className="filter-chip-clear" onClick={() => handleDateChange({ datePreset: 'all', startDate: '', endDate: '' })} title="Clear custom dates">
                <X size={12} />
              </span>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetAllFilters}
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: 'auto', padding: '0.2rem 0.65rem', fontSize: '0.75rem' }}
          >
            Clear all
          </button>
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '1rem' }} />
          <div>Loading articles...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '540px', margin: '2rem auto' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Search size={22} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.4rem' }}>No articles found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            No articles match your search or filter criteria.
          </p>
          <button
            onClick={handleResetAllFilters}
            className="btn btn-primary btn-sm"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>
              Showing {posts.length} {posts.length === 1 ? 'article' : 'articles'} {pagination?.total ? `(Total ${pagination.total})` : ''}
            </span>
          </div>

          <div className="cards-grid">
            {posts.map((post) => (
              <BlogCard key={post._id} post={post} />
            ))}
          </div>

          <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
        </>
      )}
    </div>
  );
};
