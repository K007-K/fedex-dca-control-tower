'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase/client';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') ?? '/dashboard';
    const errorParam = searchParams.get('error');

    // Show error from callback
    if (errorParam && !error) {
        setError(errorParam);
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const supabase = getSupabaseClient();
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            router.push(redirectTo);
            router.refresh();
        } catch {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700 border border-danger-200">
                    {error}
                </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@fedex.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                            href="/forgot-password"
                            className="text-sm text-primary hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    {/* P2-3 FIX: Password field with show/hide toggle */}
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
            </form>

            {/* Demo credentials hint */}
            <div className="rounded-lg bg-blue-50 p-4 text-sm border border-blue-200">
                <p className="font-medium text-blue-900 mb-2">Demo Credentials:</p>
                <p className="text-blue-700">Email: <code className="bg-blue-100 px-1 rounded">admin@fedex.com</code></p>
                <p className="text-blue-700 text-xs mt-1">
                    Contact your administrator for password or account setup.
                </p>
            </div>
        </div>
    );
}

function LoginFormFallback() {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="h-4 w-12 skeleton rounded" />
                    <div className="h-10 w-full skeleton rounded-md" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-16 skeleton rounded" />
                    <div className="h-10 w-full skeleton rounded-md" />
                </div>
                <div className="h-11 w-full skeleton rounded-lg" />
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
                <Link href="/" className="lg:hidden mb-4 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary hover:bg-primary-700 transition-colors">
                        <span className="text-2xl font-bold text-white">F</span>
                    </div>
                </Link>
                <CardTitle className="text-2xl">Welcome back</CardTitle>
                <CardDescription>
                    Sign in to your FedEx DCA Control Tower account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<LoginFormFallback />}>
                    <LoginForm />
                </Suspense>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    Need access?{' '}
                    <span className="text-primary font-medium">
                        Contact your administrator
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
