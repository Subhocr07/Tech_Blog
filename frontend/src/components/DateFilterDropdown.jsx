import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, X } from 'lucide-react';

const DATE_PRESETS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Past 7 Days' },
  { value: 'month', label: 'Past 30 Days' },
  { value: 'year', label: 'This Year' },
];

export const DateFilterDropdown = ({
  datePreset = 'all',
  startDate = '',
  endDate = '',
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);
  const containerRef = useRef(null);

  useEffect(() => {
    setCustomStart(startDate);
    setCustomEnd(endDate);
  }, [startDate, endDate]);

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

  const hasActiveCustomRange = Boolean(startDate || endDate);
  const hasActivePreset = datePreset && datePreset !== 'all';
  const isFilterActive = hasActiveCustomRange || hasActivePreset;

  const getButtonLabel = () => {
    if (hasActiveCustomRange) {
      if (startDate && endDate) return `${startDate} → ${endDate}`;
      if (startDate) return `From ${startDate}`;
      if (endDate) return `Until ${endDate}`;
    }
    if (hasActivePreset) {
      const match = DATE_PRESETS.find((p) => p.value === datePreset);
      return match ? match.label : 'Date Filter';
    }
    return 'Date Filter';
  };

  const handleSelectPreset = (presetVal) => {
    if (presetVal === 'all') {
      onChange({ datePreset: 'all', startDate: '', endDate: '' });
    } else {
      onChange({ datePreset: presetVal, startDate: '', endDate: '' });
    }
    setCustomStart('');
    setCustomEnd('');
    setIsOpen(false);
  };

  const handleApplyCustomRange = (e) => {
    e.preventDefault();
    onChange({
      datePreset: '',
      startDate: customStart,
      endDate: customEnd,
    });
    setIsOpen(false);
  };

  const handleClear = (e) => {
    if (e) e.stopPropagation();
    setCustomStart('');
    setCustomEnd('');
    onChange({ datePreset: 'all', startDate: '', endDate: '' });
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`filter-trigger-btn ${isFilterActive ? 'active' : ''}`}
        >
          <Calendar size={15} color={isFilterActive ? '#58a6ff' : 'var(--text-muted)'} />
          <span>{getButtonLabel()}</span>
          <ChevronDown
            size={14}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              color: 'var(--text-muted)',
            }}
          />
          {isFilterActive && (
            <span
              onClick={handleClear}
              className="filter-reset-icon-btn"
              title="Clear date filter"
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
            width: '260px',
            padding: '0.75rem',
            boxShadow: 'var(--shadow-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              PRESETS
            </span>
            {isFilterActive && (
              <button
                type="button"
                onClick={handleClear}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.85rem' }}>
            {DATE_PRESETS.map((preset) => {
              const isSelected = !hasActiveCustomRange && (datePreset === preset.value || (!datePreset && preset.value === 'all'));
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleSelectPreset(preset.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.4rem 0.6rem',
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
                  <span>{preset.label}</span>
                  {isSelected && <Check size={13} color="var(--primary)" />}
                </button>
              );
            })}
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>
              CUSTOM DATE RANGE
            </div>

            <form onSubmit={handleApplyCustomRange} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  From
                </label>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: 'auto', width: '100%' }}
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  To
                </label>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', height: 'auto', width: '100%' }}
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                <button
                  type="submit"
                  disabled={!customStart && !customEnd}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                >
                  Apply Range
                </button>
                {(customStart || customEnd) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStart('');
                      setCustomEnd('');
                      onChange({ datePreset: 'all', startDate: '', endDate: '' });
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
