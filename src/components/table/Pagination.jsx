import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const generatePageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3,4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-wrap justify-center items-center space-x-2 text-sm mt-4">
      {/* Previous Button */}
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`px-3 py-1.5 rounded-md border transition-all ${
          currentPage === 1
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-[#01AE9A] text-white border-[#01AE9A] hover:bg-[#009882] hover:border-[#009882]"
        }`}
      >
        &lt;
      </button>

      {/* Page Numbers */}
      <div className="flex flex-wrap justify-center items-center gap-2">
        {generatePageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => page !== "..." && onPageChange(page)}
            className={`px-2 sm:px-3 py-1 rounded-md border transition-all ${
              page === currentPage
                ? "bg-[#01AE9A] text-white border-[#01AE9A] font-bold shadow-md"
                : page === "..."
                ? "bg-transparent text-gray-400 cursor-default"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
            disabled={page === "..." ? true : false}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`px-3 py-1.5 rounded-md border transition-all ${
          currentPage === totalPages
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-[#01AE9A] text-white border-[#01AE9A] hover:bg-[#009882] hover:border-[#009882]"
        }`}
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;
