'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface ServiceStatus {
    name: string;
    description: string;
    icon: string;
    status: 'checking' | 'connected' | 'error' | 'disconnected';
    message: string;
}

export default function IntegrationsSettingsPage() {
    const [services, setServices] = useState<ServiceStatus[]>([
        {
            name: 'Supabase',
            description: 'Database and authentication service',
            icon: '🗄️',
            status: 'checking',
            message: 'Checking connection...',
        },
        {
            name: 'ML Service',
            description: 'AI/ML predictions and recommendations',
            icon: '🤖',
            status: 'checking',
            message: 'Checking connection...',
        },
        {
            name: 'Email Service',
            description: 'Notification emails and alerts',
            icon: '📧',
            status: 'disconnected',
            message: 'Not configured',
        },
        {
            name: 'Slack',
            description: 'Team notifications and alerts',
            icon: '💬',
            status: 'disconnected',
            message: 'Not connected',
        },
    ]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const checkConnections = async () => {
        setIsRefreshing(true);

        // Check Supabase
        try {
            const supabaseRes = await fetch('/api/health');
            const supabaseData = await supabaseRes.json();
            setServices(prev => prev.map(s =>
                s.name === 'Supabase'
                    ? {
                        ...s, status: supabaseData.database === 'connected' ? 'connected' : 'error',
                        message: supabaseData.database === 'connected' ? 'Connected & healthy' : 'Connection failed'
                    }
                    : s
            ));
        } catch {
            setServices(prev => prev.map(s =>
                s.name === 'Supabase' ? { ...s, status: 'error', message: 'Health check failed' } : s
            ));
        }

        // Check ML Service
        try {
            const mlRes = await fetch('http://localhost:8000/health', {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            if (mlRes.ok) {
                const mlData = await mlRes.json();
                setServices(prev => prev.map(s =>
                    s.name === 'ML Service'
                        ? { ...s, status: 'connected', message: `v${mlData.version || '1.0'} - Active on port 8000` }
                        : s
                ));
            } else {
                throw new Error('Not OK');
            }
        } catch {
            setServices(prev => prev.map(s =>
                s.name === 'ML Service'
                    ? { ...s, status: 'error', message: 'ML Service not running on port 8000' }
                    : s
            ));
        }

        setIsRefreshing(false);
    };

    useEffect(() => {
        checkConnections();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'connected':
                return <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded-full">Connected</span>;
            case 'checking':
                return <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full animate-pulse">Checking...</span>;
            case 'error':
                return <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">Error</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-full">Disconnected</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb Navigation */}
            <div>
                <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Link href="/settings" className="hover:text-gray-700 dark:hover:text-gray-300">Settings</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 dark:text-white">Integrations</span>
                </nav>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Integrations</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect external services and manage API integrations</p>
                    </div>
                    <button
                        onClick={checkConnections}
                        disabled={isRefreshing}
                        className="px-4 py-2 text-sm bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] disabled:opacity-50"
                    >
                        {isRefreshing ? '🔄 Checking...' : '🔄 Refresh Status'}
                    </button>
                </div>
            </div>

            {/* Connected Services - Real Status */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Service Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                        <div
                            key={service.name}
                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-[#222] rounded-lg hover:border-gray-300 dark:hover:border-[#333] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg flex items-center justify-center text-xl">
                                    {service.icon}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{service.description}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                {getStatusBadge(service.status)}
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{service.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Environment Info */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Environment</h3>
                <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">Supabase URL</span>
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                            {process.env.NEXT_PUBLIC_SUPABASE_URL ? '••••configured' : 'Not set'}
                        </span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">ML Service URL</span>
                        <span className="font-mono text-sm text-gray-900 dark:text-white">http://localhost:8000</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">Environment</span>
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                            {process.env.NODE_ENV || 'development'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Webhooks */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Webhooks</h3>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm">
                        + Add Webhook
                    </button>
                </div>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <span className="text-4xl mb-2 block">🔗</span>
                    <p>No webhooks configured</p>
                    <p className="text-sm">Add a webhook to receive real-time updates</p>
                </div>
            </div>
        </div>
    );
}
