import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '2.5rem 0 1rem' }}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!pagination.hasPrevPage}
        className="btn btn-secondary btn-sm"
        aria-label="Previous Page"
      >
        <ChevronLeft size={16} />
        <span>Previous</span>
      </button>

      {getPageNumbers().map((num) => (
        <button
          key={num}
          onClick={() => onPageChange(num)}
          className={`btn btn-sm ${num === page ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minWidth: '36px' }}
        >
          {num}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!pagination.hasNextPage}
        className="btn btn-secondary btn-sm"
        aria-label="Next Page"
      >
        <span>Next</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
