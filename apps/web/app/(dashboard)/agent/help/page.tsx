'use client';

/**
 * Agent Help Page
 * 
 * PURPOSE: Provide guidance and FAQ for agents
 * SCOPE: Agent-specific help content
 */

import Link from 'next/link';
import { useState } from 'react';

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const faqItems: FAQItem[] = [
    {
        category: 'Getting Started',
        question: 'How do I view my assigned cases?',
        answer: 'Click on "My Cases" in the sidebar. You will see all cases currently assigned to you with their status and SLA countdown.',
    },
    {
        category: 'Getting Started',
        question: 'What do the SLA timers mean?',
        answer: 'SLA (Service Level Agreement) timers show how much time you have to complete specific actions on a case. Red indicates the SLA is breached. Yellow indicates it\'s due soon.',
    },
    {
        category: 'Working on Cases',
        question: 'How do I contact a customer?',
        answer: 'Open the case detail page and click "Log Contact". After making your call or sending an email, log the outcome (Answered, No Answer, Voicemail, etc.) to keep accurate records.',
    },
    {
        category: 'Working on Cases',
        question: 'How do I update a case status?',
        answer: 'On the case detail page, click "Update Status". You can only transition to valid next statuses based on the workflow (e.g., Allocated → In Progress → Customer Contacted).',
    },
    {
        category: 'Working on Cases',
        question: 'How do I record a payment?',
        answer: 'On the case detail page, click "Record Payment". Enter the amount received, payment method, and any reference number. The outstanding balance will be automatically updated.',
    },
    {
        category: 'Calendar & Callbacks',
        question: 'How do I schedule a callback?',
        answer: 'From the case detail page, you can schedule a reminder to call the customer back at a specific time. These will appear in your Calendar page.',
    },
    {
        category: 'Calendar & Callbacks',
        question: 'What happens if I miss a scheduled callback?',
        answer: 'Missed callbacks appear in the "Overdue" section of your Calendar. Make sure to complete or reschedule them as soon as possible.',
    },
    {
        category: 'Compliance',
        question: 'What information am I allowed to share with customers?',
        answer: 'Only share information directly related to the debt (amount owed, payment options). Never share information about other customers or internal FedEx processes.',
    },
    {
        category: 'Compliance',
        question: 'Is my activity being logged?',
        answer: 'Yes, all actions (calls, notes, status changes, payments) are logged in the case timeline for audit and compliance purposes.',
    },
    {
        category: 'Technical Issues',
        question: 'The page is not loading correctly. What should I do?',
        answer: 'Try refreshing the page (Ctrl+R or Cmd+R). If the issue persists, clear your browser cache or contact your supervisor.',
    },
];

export default function AgentHelpPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [expandedItem, setExpandedItem] = useState<number | null>(null);

    const categories = ['All', ...Array.from(new Set(faqItems.map(item => item.category)))];

    const filteredItems = selectedCategory === 'All'
        ? faqItems
        : faqItems.filter(item => item.category === selectedCategory);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help & FAQ</h1>
                <p className="text-gray-500 dark:text-gray-400">Find answers to common questions</p>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickLink
                    href="/agent/overview"
                    icon="🏠"
                    title="Overview"
                    description="Learn how the workbench works"
                />
                <QuickLink
                    href="/agent/dashboard"
                    icon="📊"
                    title="My Dashboard"
                    description="View your workload"
                />
                <QuickLink
                    href="/agent/calendar"
                    icon="📅"
                    title="Calendar"
                    description="Manage scheduled callbacks"
                />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333]'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* FAQ List */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] divide-y divide-gray-100 dark:divide-[#222]">
                {filteredItems.map((item, index) => (
                    <div key={index} className="p-4">
                        <button
                            onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                            className="w-full flex items-start justify-between gap-4 text-left"
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-lg mt-0.5">❓</span>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {item.question}
                                    </p>
                                    <span className="text-xs text-gray-400 mt-1 inline-block">
                                        {item.category}
                                    </span>
                                </div>
                            </div>
                            <span className={`text-gray-400 transition-transform ${expandedItem === index ? 'rotate-180' : ''}`}>
                                ▼
                            </span>
                        </button>
                        {expandedItem === index && (
                            <div className="mt-3 pl-9 text-sm text-gray-600 dark:text-gray-400 animate-fade-in">
                                {item.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Contact Support */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-6 text-center">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    Need More Help?
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                    If you can&apos;t find what you&apos;re looking for, contact your supervisor or the DCA admin team.
                </p>
                <div className="flex justify-center gap-3">
                    <Link
                        href="/settings/profile"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                        View My Profile
                    </Link>
                </div>
            </div>
        </div>
    );
}

function QuickLink({ href, icon, title, description }: {
    href: string;
    icon: string;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors group"
        >
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                    <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                        {title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    );
}
