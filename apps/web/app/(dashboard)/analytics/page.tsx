export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-500">Track recovery trends and DCA performance metrics</p>
                </div>
                <div className="flex gap-2">
                    <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>Last 30 days</option>
                        <option>Last 90 days</option>
                        <option>This year</option>
                    </select>
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                        Export Report
                    </button>
                </div>
            </div>

            {/* Placeholder Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Trends</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center">
                            <span className="text-4xl">📈</span>
                            <p className="text-gray-500 mt-2">Chart coming soon</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">DCA Performance Comparison</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center">
                            <span className="text-4xl">📊</span>
                            <p className="text-gray-500 mt-2">Chart coming soon</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard Coming Soon</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    Interactive charts, custom report builder, and detailed performance analytics are under development.
                </p>
                <a
                    href="/api/analytics/dashboard"
                    target="_blank"
                    className="inline-block mt-4 text-primary font-medium hover:underline"
                >
                    View Analytics API →
                </a>
            </div>
        </div>
    );
}
