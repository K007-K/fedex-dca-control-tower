import Link from 'next/link';

import { DCACreateForm } from '@/components/dcas/DCACreateForm';

export default function NewDCAPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <nav className="flex items-center text-sm text-gray-500 mb-2">
                    <Link href="/dcas" className="hover:text-primary">DCAs</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">New DCA</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">Add New DCA</h1>
                <p className="text-gray-500">Register a new debt collection agency</p>
            </div>

            {/* Form */}
            <DCACreateForm />
        </div>
    );
}
