import React, { useState, useRef, useEffect } from 'react';
import { Tag, ChevronDown, Check, X, Search } from 'lucide-react';

export const MultiSelectDropdown = ({
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select tags...',
  label = 'Tags',
  isFilter = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOption = (tag) => {
    const isSelected = selected.includes(tag);
    if (isSelected) {
      onChange(selected.filter((item) => item !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  if (isFilter) {
    return (
      <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`filter-trigger-btn ${selected.length > 0 ? 'active' : ''}`}
        >
          <Tag size={15} color={selected.length > 0 ? '#58a6ff' : 'var(--text-muted)'} />
          <span>Categories</span>
          {selected.length > 0 && (
            <span className="filter-badge-count">{selected.length}</span>
          )}
          <ChevronDown
            size={14}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              color: 'var(--text-muted)',
            }}
          />
          {selected.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="filter-reset-icon-btn"
              title="Reset categories"
            >
              <X size={12} />
            </span>
          )}
        </button>

        {isOpen && (
          <div
            className="card"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              zIndex: 50,
              width: '240px',
              padding: '0.65rem',
              boxShadow: 'var(--shadow-md)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
            }}
          >
            <div
              style={{
                position: 'relative',
                marginBottom: '0.5rem',
              }}
            >
              <Search
                size={13}
                style={{
                  position: 'absolute',
                  left: '0.6rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{
                  padding: '0.35rem 0.5rem 0.35rem 1.8rem',
                  fontSize: '0.8rem',
                  height: 'auto',
                }}
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>Select multiple tags</span>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
                >
                  Clear all
                </button>
              )}
            </div>

            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
              }}
            >
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                  No matching tags
                </div>
              ) : (
                filteredOptions.map((tag) => {
                  const isChecked = selected.includes(tag);
                  return (
                    <label
                      key={tag}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.35rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '0.825rem',
                        background: isChecked ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        color: isChecked ? 'var(--primary)' : 'var(--text-primary)',
                        userSelect: 'none',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOption(tag)}
                          style={{ cursor: 'pointer' }}
                        />
                        #{tag}
                      </span>
                      {isChecked && <Check size={13} />}
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="form-group" ref={containerRef} style={{ position: 'relative' }}>
      {label && <label className="form-label">{label}</label>}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="form-input"
        style={{
          minHeight: '44px',
          height: 'auto',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.4rem 0.75rem',
          flexWrap: 'wrap',
          gap: '0.4rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', flex: 1, alignItems: 'center' }}>
          {selected.length === 0 ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {placeholder}
            </span>
          ) : (
            selected.map((tag) => (
              <span
                key={tag}
                className="badge badge-tag"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.78rem',
                  padding: '0.15rem 0.5rem',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(tag);
                }}
              >
                #{tag}
                <X size={11} style={{ cursor: 'pointer' }} />
              </span>
            ))
          )}
        </div>

        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </div>

      {isOpen && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 60,
            padding: '0.65rem',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card, #111827)',
          }}
        >
          <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: '0.6rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{
                padding: '0.35rem 0.5rem 0.35rem 1.8rem',
                fontSize: '0.825rem',
                height: 'auto',
              }}
              placeholder="Search available tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div
            style={{
              maxHeight: '190px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                No tags found
              </div>
            ) : (
              filteredOptions.map((tag) => {
                const isChecked = selected.includes(tag);
                return (
                  <div
                    key={tag}
                    onClick={() => toggleOption(tag)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      background: isChecked ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: isChecked ? 'var(--primary)' : 'var(--text-primary)',
                      userSelect: 'none',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ cursor: 'pointer' }}
                      />
                      #{tag}
                    </span>
                    {isChecked && <Check size={14} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
