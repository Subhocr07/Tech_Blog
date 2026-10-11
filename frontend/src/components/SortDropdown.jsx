import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check, ChevronDown, X } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'last_created', label: 'Last created' },
  { value: 'first_created', label: 'First created' },
  { value: 'a_z', label: 'A-Z' },
  { value: 'z_a', label: 'Z-A' },
];

export const SortDropdown = ({ value = 'last_created', onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const currentOption = SORT_OPTIONS.find((opt) => opt.value === value) || SORT_OPTIONS[0];

  const handleSelect = (sortVal) => {
    onChange(sortVal);
    setIsOpen(false);
  };

  const isNonDefault = value !== 'last_created';

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`filter-trigger-btn ${isNonDefault ? 'active' : ''}`}
        >
          <ArrowUpDown size={15} color={isNonDefault ? '#58a6ff' : 'var(--text-muted)'} />
          <span>Sort: {currentOption.label}</span>
          <ChevronDown
            size={14}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              color: 'var(--text-muted)',
            }}
          />
          {isNonDefault && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('last_created');
              }}
              className="filter-reset-icon-btn"
              title="Reset sort"
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
            width: '200px',
            padding: '0.45rem',
            boxShadow: 'var(--shadow-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.6rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              SORT BY
            </span>
            {isNonDefault && (
              <button
                type="button"
                onClick={() => handleSelect('last_created')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Reset
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {SORT_OPTIONS.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={14} color="var(--primary)" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
