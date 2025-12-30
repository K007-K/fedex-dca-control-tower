'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { isValidTOTPCode } from '@/lib/auth/mfa';

/**
 * MFA Verification Page
 * P1-9 FIX: Wire MFA module into login flow
 */
export default function MFAVerifyPage() {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [method, setMethod] = useState<'totp' | 'email'>('totp');
    const [emailSent, setEmailSent] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/dashboard';

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Request email code
    const sendEmailCode = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: '', // Will use the authenticated user's email
            });

            if (error) {
                setError(error.message);
            } else {
                setEmailSent(true);
            }
        } catch {
            setError('Failed to send verification code');
        } finally {
            setIsLoading(false);
        }
    };

    // Verify TOTP or email code
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isValidTOTPCode(code)) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setIsLoading(true);

        try {
            // For TOTP verification, use Supabase MFA
            const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

            if (factorsError) {
                setError(factorsError.message);
                return;
            }

            // Find TOTP factor
            const totpFactor = factors?.totp?.[0];

            if (!totpFactor) {
                setError('MFA not configured. Please set up MFA first.');
                return;
            }

            // Challenge and verify
            const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: totpFactor.id,
            });

            if (challengeError) {
                setError(challengeError.message);
                return;
            }

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: totpFactor.id,
                challengeId: challenge.id,
                code,
            });

            if (verifyError) {
                setError('Invalid verification code. Please try again.');
                return;
            }

            // Success - redirect
            router.push(redirectTo);
            router.refresh();
        } catch {
            setError('Verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="text-center mb-6">
                        <span className="text-5xl">🔐</span>
                        <h2 className="mt-4 text-2xl font-bold text-gray-900">
                            Two-Factor Authentication
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Enter the verification code from your authenticator app
                        </p>
                    </div>

                    {/* Method Toggle */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setMethod('totp')}
                            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition ${method === 'totp'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            📱 Authenticator
                        </button>
                        <button
                            onClick={() => {
                                setMethod('email');
                                if (!emailSent) sendEmailCode();
                            }}
                            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition ${method === 'email'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            📧 Email Code
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    {method === 'email' && emailSent && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg">
                            ✓ Verification code sent to your email
                        </div>
                    )}

                    <form onSubmit={handleVerify}>
                        <div className="mb-6">
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                                Verification Code
                            </label>
                            <input
                                id="code"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                autoComplete="one-time-code"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || code.length !== 6}
                            className="w-full py-3 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {isLoading ? 'Verifying...' : 'Verify'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => router.back()}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            ← Back to login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
