/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',

                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                    hover: '#059669', // Keep hardcoded or map to var if needed
                    glow: 'rgba(16, 185, 129, 0.4)',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                    hover: 'hsl(var(--secondary) / 0.8)',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',

                // Custom
                surface: 'hsl(var(--surface))',

                // Keeping 'theme' for backward compatibility but mapped to vars where possible
                theme: {
                    bg: 'hsl(var(--background))', // Was #0a0a0a
                    'bg-secondary': 'hsl(var(--surface))', // Was #1a1a1a
                    'bg-hover': 'hsl(var(--accent))', // Aproximation
                    border: 'hsl(var(--border))',
                    text: 'hsl(var(--foreground))',
                    'text-secondary': 'hsl(var(--muted-foreground))',
                    'text-muted': 'hsl(var(--muted-foreground))',
                },
            },
            backgroundImage: {
                'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                'gradient-green': 'linear-gradient(to right, #10b981, #059669)',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'float': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
                'glow': '0 0 20px rgba(16, 185, 129, 0.15)',
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            borderRadius: {
                'sm': '0.375rem',
                'md': '0.5rem',
                'lg': '0.75rem',
                'xl': '1rem',
                '2xl': '1.5rem',
            },
            keyframes: {
                "accordion-down": {
                    from: { height: 0 },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: 0 },
                },
                fadeIn: {
                    from: { opacity: 0, transform: 'translateY(10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                }
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fadeIn 0.4s ease-out forwards",
                "float": "float 3s ease-in-out infinite",
                "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
