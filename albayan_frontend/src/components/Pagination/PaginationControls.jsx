import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
}) => {
  // Show pagination only if there are more than 1 page
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center px-4 py-3">
      {/* Pagination controls - Previous/Next only */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          className={`px-3 py-2 text-sm font-medium rounded-md border ${
            hasPreviousPage
              ? 'text-gray-700 bg-transparent border-gray-300 hover:bg-gray-50'
              : 'text-gray-400 bg-transparent border-gray-200 cursor-not-allowed'
          }`}
        >
          <FiChevronLeft size={16} className="inline mr-1" />
          Previous
        </button>

        {/* Page indicator */}
        <span className="text-sm text-gray-700 px-3">
          Page {currentPage} of {totalPages}
        </span>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className={`px-3 py-2 text-sm font-medium rounded-md border ${
            hasNextPage
              ? 'text-gray-700 bg-transparent border-gray-300 hover:bg-gray-50'
              : 'text-gray-400 bg-transparent border-gray-200 cursor-not-allowed'
          }`}
        >
          Next
          <FiChevronRight size={16} className="inline ml-1" />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
