/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Strict Blackscale Palette
                'surface-0': '#000000',      // Pure black
                'surface-1': '#09090b',      // Zinc-950
                'surface-2': '#18181b',      // Zinc-900
                'surface-3': '#27272a',      // Zinc-800

                // Glass effects
                'glass-bg': 'rgba(255,255,255,0.03)',
                'glass-border': 'rgba(255,255,255,0.08)',

                // Accents (Mapped to Monochrome)
                'accent-cyan': '#ffffff',    // Primary White
                'accent-purple': '#a1a1aa',  // Secondary Silver
                'accent-amber': '#71717a',   // Tertiary Zinc

                // shadcn semantic colors
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "fade-in": {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                "slide-up": {
                    from: { transform: "translateY(10px)", opacity: "0" },
                    to: { transform: "translateY(0)", opacity: "1" },
                },
                "scale-in": {
                    from: { transform: "scale(0.95)", opacity: "0" },
                    to: { transform: "scale(1)", opacity: "1" },
                },
            },
            animation: {
                "fade-in": "fade-in 0.2s ease-out",
                "slide-up": "slide-up 0.3s ease-out",
                "scale-in": "scale-in 0.2s ease-out",
            },
        },
    },
    plugins: [],
}
