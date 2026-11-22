import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-5">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn-press inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeftIcon size={14} />
        <span>Sebelumnya</span>
      </button>

      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="btn-press px-2.5 py-1.5 text-xs font-medium tabular-nums text-zinc-300 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08]"
          >
            1
          </button>
          {startPage > 2 && (
            <span className="px-1 text-zinc-600 text-xs">...</span>
          )}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`btn-press px-3 py-1.5 text-xs font-medium rounded-lg tabular-nums ${
            page === currentPage
              ? 'bg-blue-600 text-white border border-blue-500 font-semibold'
              : 'text-zinc-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]'
          }`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="px-1 text-zinc-600 text-xs">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="btn-press px-2.5 py-1.5 text-xs font-medium tabular-nums text-zinc-300 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08]"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn-press inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <span>Selanjutnya</span>
        <ChevronRightIcon size={14} />
      </button>
    </div>
  );
};
