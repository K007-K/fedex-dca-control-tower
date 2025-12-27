export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-700 p-12">
                <div className="flex flex-col justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                            <span className="text-2xl font-bold text-white">F</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">FedEx</h1>
                            <p className="text-sm text-white/80">DCA Control Tower</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-4xl font-bold text-white leading-tight">
                            Enterprise Debt Collection
                            <br />
                            Management System
                        </h2>
                        <p className="text-lg text-white/80 max-w-md">
                            Centralized command center for managing 500+ DCAs across 50+ countries
                            with AI-powered insights and real-time monitoring.
                        </p>

                        <div className="grid grid-cols-2 gap-4 pt-6">
                            <div className="rounded-lg bg-white/10 p-4">
                                <p className="text-3xl font-bold text-white">500+</p>
                                <p className="text-sm text-white/70">Active DCAs</p>
                            </div>
                            <div className="rounded-lg bg-white/10 p-4">
                                <p className="text-3xl font-bold text-white">50+</p>
                                <p className="text-sm text-white/70">Countries</p>
                            </div>
                            <div className="rounded-lg bg-white/10 p-4">
                                <p className="text-3xl font-bold text-white">99.9%</p>
                                <p className="text-sm text-white/70">Uptime SLA</p>
                            </div>
                            <div className="rounded-lg bg-white/10 p-4">
                                <p className="text-3xl font-bold text-white">24/7</p>
                                <p className="text-sm text-white/70">Monitoring</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-white/60">
                        © {new Date().getFullYear()} FedEx Corporation. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right side - Auth Form */}
            <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    );
}
