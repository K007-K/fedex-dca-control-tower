'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to monitoring service
        console.error('Global error:', error);
    }, [error]);

    return (
        <html lang="en">
            <body className="min-h-screen bg-gray-50 font-sans antialiased">
                <div className="flex min-h-screen flex-col items-center justify-center px-4">
                    <div className="mx-auto max-w-md text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-danger-50 mx-auto">
                            <svg
                                className="h-10 w-10 text-danger"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h1 className="mb-4 text-3xl font-bold text-gray-900">
                            Something went wrong
                        </h1>
                        <p className="mb-8 text-gray-600">
                            An unexpected error occurred. Our team has been notified and is
                            working on a fix.
                        </p>
                        {error.digest && (
                            <p className="mb-6 text-sm text-gray-500">
                                Error ID: <code className="rounded bg-gray-100 px-2 py-1">{error.digest}</code>
                            </p>
                        )}
                        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                            <button
                                onClick={reset}
                                className="rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
                            >
                                Try Again
                            </button>
                            <Link
                                href="/"
                                className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
