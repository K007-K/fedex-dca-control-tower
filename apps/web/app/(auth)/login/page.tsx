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
                    <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />
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
