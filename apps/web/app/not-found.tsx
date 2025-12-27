import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
            <div className="mx-auto max-w-md text-center">
                <div className="mb-6">
                    <span className="text-8xl font-bold text-primary">404</span>
                </div>
                <h1 className="mb-4 text-3xl font-bold text-gray-900">Page Not Found</h1>
                <p className="mb-8 text-gray-600">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <Link
                        href="/"
                        className="rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
                    >
                        Go Home
                    </Link>
                    <Link
                        href="/dashboard"
                        className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
