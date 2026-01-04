/**
 * Analytics Library Index
 * 
 * Re-exports all canonical metrics for easy importing.
 */

export {
    // Metric functions
    getCaseSummaryMetrics,
    getSLAMetrics,
    getAgingBuckets,
    getDCAPerformanceMetrics,
    getMetricsForExport,
    // Types
    type MetricFilters,
    type CaseSummaryMetrics,
    type SLAMetrics,
    type AgingBucket,
    type DCAPerformanceMetrics,
} from './canonical-metrics';
