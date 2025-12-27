import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            // FedEx Brand Colors + Enterprise Design System
            colors: {
                // FedEx Primary
                fedex: {
                    purple: '#4D148C',
                    orange: '#FF6600',
                },
                // Semantic Colors
                primary: {
                    DEFAULT: '#4D148C',
                    50: '#F5F0FA',
                    100: '#EBE1F5',
                    200: '#D7C3EB',
                    300: '#C3A5E1',
                    400: '#9E69CD',
                    500: '#7A2DB9',
                    600: '#4D148C',
                    700: '#3D1070',
                    800: '#2D0C54',
                    900: '#1E0838',
                },
                accent: {
                    DEFAULT: '#FF6600',
                    50: '#FFF3EB',
                    100: '#FFE7D6',
                    200: '#FFCFAD',
                    300: '#FFB785',
                    400: '#FF9F5C',
                    500: '#FF6600',
                    600: '#CC5200',
                    700: '#993D00',
                    800: '#662900',
                    900: '#331400',
                },
                // Status Colors
                success: {
                    DEFAULT: '#10B981',
                    50: '#ECFDF5',
                    100: '#D1FAE5',
                    500: '#10B981',
                    600: '#059669',
                    700: '#047857',
                },
                warning: {
                    DEFAULT: '#F59E0B',
                    50: '#FFFBEB',
                    100: '#FEF3C7',
                    500: '#F59E0B',
                    600: '#D97706',
                    700: '#B45309',
                },
                danger: {
                    DEFAULT: '#EF4444',
                    50: '#FEF2F2',
                    100: '#FEE2E2',
                    500: '#EF4444',
                    600: '#DC2626',
                    700: '#B91C1C',
                },
                info: {
                    DEFAULT: '#3B82F6',
                    50: '#EFF6FF',
                    100: '#DBEAFE',
                    500: '#3B82F6',
                    600: '#2563EB',
                    700: '#1D4ED8',
                },
                // Neutral Gray Scale
                gray: {
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    300: '#D1D5DB',
                    400: '#9CA3AF',
                    500: '#6B7280',
                    600: '#4B5563',
                    700: '#374151',
                    800: '#1F2937',
                    900: '#111827',
                    950: '#030712',
                },
                // Background
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
            },
            // Typography
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            fontSize: {
                '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
            },
            // Spacing
            spacing: {
                '18': '4.5rem',
                '112': '28rem',
                '128': '32rem',
            },
            // Border Radius
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            // Box Shadow
            boxShadow: {
                'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
                'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'elevated': '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
            },
            // Animations
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 3s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
            // Max Width
            maxWidth: {
                '8xl': '88rem',
                '9xl': '96rem',
            },
        },
    },
    plugins: [
        require('tailwindcss-animate'),
    ],
};

export default config;
