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

interface Webhook {
    id: string;
    name: string;
    url: string;
    events: string[];
    enabled: boolean;
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
            status: 'checking',
            message: 'Checking configuration...',
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
    const [showWebhookModal, setShowWebhookModal] = useState(false);
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: ['case.updated'] });
    const [showApiKey, setShowApiKey] = useState(false);
    const [apiKey, setApiKey] = useState('fedex_prod_xxxxxxxxxxxxxxxxxxxxxxxx');
    const [fullApiKey, setFullApiKey] = useState<string | null>(null); // Full key only available after regeneration
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [userRole, setUserRole] = useState<string>('');

    // Fetch user role on mount
    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUserRole(data.role || '');
                }
            } catch (err) {
                console.error('Failed to fetch user role:', err);
            }
        };
        fetchUserRole();
    }, []);

    // Show toast notification
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000); // Auto-hide after 3 seconds
    };

    const checkConnections = async () => {
        setIsRefreshing(true);

        // Check Supabase via health API
        try {
            const supabaseRes = await fetch('/api/health');
            const supabaseData = await supabaseRes.json();
            const isConnected = supabaseData.services?.database?.connected === true;
            setServices(prev => prev.map(s =>
                s.name === 'Supabase'
                    ? {
                        ...s,
                        status: isConnected ? 'connected' : 'error',
                        message: isConnected ? 'Connected & healthy' : (supabaseData.services?.database?.error || 'Connection failed')
                    }
                    : s
            ));
        } catch {
            setServices(prev => prev.map(s =>
                s.name === 'Supabase' ? { ...s, status: 'error', message: 'Health check failed' } : s
            ));
        }

        // Check ML Service via proxy API (works on both localhost and production)
        try {
            const mlRes = await fetch('/api/ml/health', {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            if (mlRes.ok) {
                const mlData = await mlRes.json();
                setServices(prev => prev.map(s =>
                    s.name === 'ML Service'
                        ? { ...s, status: 'connected', message: `v${mlData.version || '1.0'} - Active` }
                        : s
                ));
            } else {
                throw new Error('Not OK');
            }
        } catch {
            setServices(prev => prev.map(s =>
                s.name === 'ML Service'
                    ? { ...s, status: 'error', message: 'ML Service not responding' }
                    : s
            ));
        }

        // Check Email Service (SMTP/Resend)
        try {
            const emailRes = await fetch('/api/health/email');
            const emailData = await emailRes.json();
            setServices(prev => prev.map(s =>
                s.name === 'Email Service'
                    ? {
                        ...s,
                        status: emailData.configured ? 'connected' : 'disconnected',
                        message: emailData.configured ? `${emailData.provider} configured` : 'Not configured'
                    }
                    : s
            ));
        } catch {
            setServices(prev => prev.map(s =>
                s.name === 'Email Service' ? { ...s, status: 'disconnected', message: 'Not configured' } : s
            ));
        }

        setIsRefreshing(false);
    };

    useEffect(() => {
        checkConnections();
        fetchWebhooks();
        fetchApiKey();
    }, []);

    const fetchWebhooks = async () => {
        try {
            const res = await fetch('/api/webhooks');
            const data = await res.json();
            if (data.data) {
                setWebhooks(data.data.map((w: { id: string; name: string; url: string; events: string[]; is_active: boolean }) => ({
                    id: w.id,
                    name: w.name,
                    url: w.url,
                    events: w.events,
                    enabled: w.is_active,
                })));
            }
        } catch (err) {
            console.error('Failed to fetch webhooks:', err);
        }
    };

    const fetchApiKey = async () => {
        try {
            const res = await fetch('/api/settings/api-keys');
            const data = await res.json();
            if (data.data) {
                setApiKey(data.data.key_prefix);
            }
        } catch (err) {
            console.error('Failed to fetch API key:', err);
        }
    };

    const handleAddWebhook = async () => {
        if (!newWebhook.name || !newWebhook.url) return;

        try {
            const res = await fetch('/api/webhooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newWebhook),
            });
            const data = await res.json();
            if (res.ok && data.data) {
                setWebhooks([...webhooks, {
                    id: data.data.id,
                    name: data.data.name,
                    url: data.data.url,
                    events: data.data.events,
                    enabled: data.data.is_active,
                }]);
                setNewWebhook({ name: '', url: '', events: ['case.updated'] });
                setShowWebhookModal(false);
            }
        } catch (err) {
            console.error('Failed to add webhook:', err);
        }
    };

    const handleDeleteWebhook = async (id: string) => {
        try {
            await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
            setWebhooks(webhooks.filter(w => w.id !== id));
        } catch (err) {
            console.error('Failed to delete webhook:', err);
        }
    };

    const handleToggleWebhook = async (id: string) => {
        const webhook = webhooks.find(w => w.id === id);
        if (!webhook) return;
        try {
            await fetch(`/api/webhooks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !webhook.enabled }),
            });
            setWebhooks(webhooks.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
        } catch (err) {
            console.error('Failed to toggle webhook:', err);
        }
    };

    const handleRegenerateApiKey = async () => {
        setIsRegenerating(true);
        try {
            const res = await fetch('/api/settings/api-keys', { method: 'POST' });
            const data = await res.json();
            if (res.ok && data.data) {
                setApiKey(data.data.key); // Show full key only on regeneration
                setFullApiKey(data.data.key); // Store full key for copying
                setShowApiKey(true);
                showToast('✓ New API key generated! Copy it now.', 'success');
            }
        } catch (err) {
            console.error('Failed to regenerate API key:', err);
        } finally {
            setIsRegenerating(false);
        }
    };

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
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in transition-all duration-300 ${toast.type === 'success'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                    }`}>
                    <span className="text-lg">{toast.type === 'success' ? '✓' : '⚠'}</span>
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}

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

            {/* FedEx Production API */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">FedEx Production API</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">API Key</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Used for authenticating external integrations
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <code className="px-3 py-2 bg-gray-100 dark:bg-[#1a1a1a] rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                                {showApiKey ? apiKey : '••••••••••••••••••••••••'}
                            </code>
                            <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                title={showApiKey ? 'Hide' : 'Reveal'}
                            >
                                {showApiKey ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3 items-center">
                        <button
                            onClick={() => {
                                if (fullApiKey) {
                                    navigator.clipboard.writeText(fullApiKey);
                                    showToast('✓ Key copied successfully!', 'success');
                                }
                            }}
                            disabled={!fullApiKey}
                            className={`px-4 py-2 text-sm rounded-lg ${fullApiKey
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-100 dark:bg-[#222] text-gray-400 cursor-not-allowed'
                                }`}
                            title={fullApiKey ? 'Copy full API key to clipboard' : 'Regenerate key first to enable copy'}
                        >
                            📋 {fullApiKey ? 'Copy Key' : 'Copy (Regenerate first)'}
                        </button>
                        {userRole === 'SUPER_ADMIN' ? (
                            <button
                                onClick={handleRegenerateApiKey}
                                disabled={isRegenerating}
                                className="px-4 py-2 text-sm bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50"
                            >
                                {isRegenerating ? '⏳ Regenerating...' : '🔄 Regenerate Key'}
                            </button>
                        ) : (
                            <span className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500">
                                🔒 Only SUPER_ADMIN can regenerate keys
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ Regenerating the API key will invalidate all existing integrations using the current key.
                    </p>
                </div>
            </div>

            {/* Environment Info */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Environment</h3>
                <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">Supabase</span>
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                            Configured
                        </span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">ML Service</span>
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                            /api/ml/* (proxied)
                        </span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                        <span className="text-gray-600 dark:text-gray-400">Environment Mode</span>
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                            Development
                        </span>
                    </div>
                </div>
            </div>

            {/* Webhooks */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Webhooks</h3>
                    <button
                        onClick={() => setShowWebhookModal(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                    >
                        + Add Webhook
                    </button>
                </div>

                {webhooks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <span className="text-4xl mb-2 block">🔗</span>
                        <p>No webhooks configured</p>
                        <p className="text-sm">Add a webhook to receive real-time updates</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {webhooks.map(webhook => (
                            <div key={webhook.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-[#222] rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${webhook.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{webhook.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{webhook.url}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleWebhook(webhook.id)}
                                        className={`px-3 py-1 text-xs rounded ${webhook.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
                                    >
                                        {webhook.enabled ? 'Active' : 'Paused'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteWebhook(webhook.id)}
                                        className="p-1 text-red-500 hover:text-red-600"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Webhook Modal */}
            {showWebhookModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-[#333]">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Webhook</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newWebhook.name}
                                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                                    placeholder="My Webhook"
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#333] rounded-lg bg-white dark:bg-[#111] text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endpoint URL</label>
                                <input
                                    type="url"
                                    value={newWebhook.url}
                                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                                    placeholder="https://your-server.com/webhook"
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#333] rounded-lg bg-white dark:bg-[#111] text-gray-900 dark:text-white font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Events</label>
                                <select
                                    multiple
                                    value={newWebhook.events}
                                    onChange={(e) => setNewWebhook({ ...newWebhook, events: Array.from(e.target.selectedOptions, o => o.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#333] rounded-lg bg-white dark:bg-[#111] text-gray-900 dark:text-white"
                                >
                                    <option value="case.created">Case Created</option>
                                    <option value="case.updated">Case Updated</option>
                                    <option value="case.escalated">Case Escalated</option>
                                    <option value="case.resolved">Case Resolved</option>
                                    <option value="sla.breach">SLA Breach</option>
                                    <option value="payment.received">Payment Received</option>
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => setShowWebhookModal(false)}
                                className="px-4 py-2 bg-gray-100 dark:bg-[#333] text-gray-700 dark:text-gray-300 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddWebhook}
                                disabled={!newWebhook.name || !newWebhook.url}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                            >
                                Add Webhook
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
