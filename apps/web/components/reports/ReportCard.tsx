'use client';

import { useState } from 'react';

import { useToast } from '@/components/ui';

interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
}

interface ReportCardProps {
    report: ReportTemplate;
}

export function ReportCard({ report }: ReportCardProps) {
    const toast = useToast();
    const [generating, setGenerating] = useState(false);
    const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);

    const handlePreview = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportType: report.id, format: 'json' }),
            });

            if (!res.ok) {
                throw new Error('Failed to generate preview');
            }

            const data = await res.json();
            setPreviewData(data);
            toast.success('Report preview generated');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to preview');
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportType: report.id, format: 'csv' }),
            });

            if (!res.ok) {
                throw new Error('Failed to generate report');
            }

            // Download the CSV
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${report.id}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Report downloaded!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to generate');
        } finally {
            setGenerating(false);
        }
    };

    const closePreview = () => setPreviewData(null);

    return (
        <>
            <div className="border border-gray-200 dark:border-[#222] rounded-lg p-4 hover:border-gray-300 dark:hover:border-[#333] hover:shadow-sm transition-all group">
                <div className="flex items-start gap-3">
                    <div className="text-3xl">{report.icon}</div>
                    <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                            {report.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{report.description}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 mt-2">
                            {report.category}
                        </span>
                    </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#222] flex gap-2">
                    <button
                        onClick={handlePreview}
                        disabled={generating}
                        className="flex-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-[#333] rounded hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
                    >
                        {generating ? 'Loading...' : 'Preview'}
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex-1 px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {generating ? 'Generating...' : 'Download CSV'}
                    </button>
                </div>
            </div>

            {/* Preview Modal */}
            {previewData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#111] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-[#222]">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#222]">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{report.name} - Preview</h2>
                            <button onClick={closePreview} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                ✕
                            </button>
                        </div>
                        <div className="p-4 overflow-auto max-h-[calc(80vh-120px)]">
                            <pre className="text-xs bg-gray-50 dark:bg-[#0a0a0a] p-4 rounded overflow-x-auto text-gray-900 dark:text-gray-300">
                                {JSON.stringify(previewData, null, 2)}
                            </pre>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-[#222]">
                            <button
                                onClick={closePreview}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                            >
                                Download CSV
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
