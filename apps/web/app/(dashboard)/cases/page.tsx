export default function CasesPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
                    <p className="text-gray-500">Manage and track all debt collection cases</p>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                    + New Case
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap gap-4">
                    <input
                        type="text"
                        placeholder="Search cases..."
                        className="flex-1 min-w-64 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>All Statuses</option>
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                    </select>
                    <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>All Priorities</option>
                        <option>Critical</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>
                </div>
            </div>

            {/* Placeholder Content */}
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cases List Coming Soon</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    The full cases management interface with filtering, sorting, and bulk operations is under development.
                </p>
                <a
                    href="/api/cases"
                    target="_blank"
                    className="inline-block mt-4 text-primary font-medium hover:underline"
                >
                    View Cases API →
                </a>
            </div>
        </div>
    );
}
