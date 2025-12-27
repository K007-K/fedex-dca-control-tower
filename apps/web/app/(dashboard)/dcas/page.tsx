export default function DCAsPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">DCAs</h1>
                    <p className="text-gray-500">Manage debt collection agencies and their performance</p>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                    + Add DCA
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Total DCAs</p>
                    <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-success">5</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Avg Recovery Rate</p>
                    <p className="text-2xl font-bold text-primary">72.3%</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Cases Assigned</p>
                    <p className="text-2xl font-bold text-gray-900">25</p>
                </div>
            </div>

            {/* Placeholder Content */}
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">DCA Management Coming Soon</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    Full DCA cards with performance metrics, capacity management, and comparison views are under development.
                </p>
                <a
                    href="/api/dcas"
                    target="_blank"
                    className="inline-block mt-4 text-primary font-medium hover:underline"
                >
                    View DCAs API →
                </a>
            </div>
        </div>
    );
}
