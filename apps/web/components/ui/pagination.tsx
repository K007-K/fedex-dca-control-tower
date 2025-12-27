'use client';

import Link from 'next/link';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    baseUrl: string;
    searchParams?: Record<string, string>;
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    baseUrl,
    searchParams = {},
}: PaginationProps) {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const buildUrl = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        return `${baseUrl}?${params.toString()}`;
    };

    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        const showPages = 5;

        if (totalPages <= showPages + 2) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);

            if (currentPage > 3) pages.push('ellipsis');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) pages.push(i);

            if (currentPage < totalPages - 2) pages.push('ellipsis');

            pages.push(totalPages);
        }

        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
            <div className="flex items-center text-sm text-gray-500">
                Showing <span className="font-medium mx-1">{startItem}</span> to{' '}
                <span className="font-medium mx-1">{endItem}</span> of{' '}
                <span className="font-medium mx-1">{totalItems}</span> results
            </div>

            <nav className="flex items-center space-x-1">
                {/* Previous */}
                {currentPage > 1 ? (
                    <Link
                        href={buildUrl(currentPage - 1)}
                        className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Previous
                    </Link>
                ) : (
                    <span className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-gray-50 border border-gray-200 rounded-md cursor-not-allowed">
                        Previous
                    </span>
                )}

                {/* Page Numbers */}
                <div className="hidden md:flex items-center space-x-1">
                    {getPageNumbers().map((page, idx) => (
                        page === 'ellipsis' ? (
                            <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-500">...</span>
                        ) : (
                            <Link
                                key={page}
                                href={buildUrl(page)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${page === currentPage
                                        ? 'bg-primary text-white'
                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {page}
                            </Link>
                        )
                    ))}
                </div>

                {/* Next */}
                {currentPage < totalPages ? (
                    <Link
                        href={buildUrl(currentPage + 1)}
                        className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Next
                    </Link>
                ) : (
                    <span className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-gray-50 border border-gray-200 rounded-md cursor-not-allowed">
                        Next
                    </span>
                )}
            </nav>
        </div>
    );
}

export default Pagination;
