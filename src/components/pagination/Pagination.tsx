"use client";
import React from "react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-10 w-10 flex items-center justify-center rounded-full border text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        {"<"}
      </button>

      {Array.from({ length: totalPages }).map((_, idx) => {
        const pageNumber = idx + 1;
        return (
          <button
            key={pageNumber}
            onClick={() => goToPage(pageNumber)}
            className={`h-10 w-10 flex items-center justify-center rounded-full transition font-semibold ${
              pageNumber === currentPage
                ? "bg-blue-600 text-white"
                : "border text-gray-600 hover:bg-blue-50 hover:text-blue-600"
            }`}
          >
            {pageNumber}
          </button>
        );
      })}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-10 w-10 flex items-center justify-center rounded-full border text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        {">"}
      </button>
    </div>
  );
};

export default Pagination;
