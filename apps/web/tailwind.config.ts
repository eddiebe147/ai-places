import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ocean/Lobster theme
        background: '#0a0e1a',
        foreground: '#f0f4f8',

        // Ocean blues
        ocean: {
          50: '#e6f3ff',
          100: '#cce7ff',
          200: '#99cfff',
          300: '#66b7ff',
          400: '#339fff',
          500: '#0087ff',
          600: '#006bcc',
          700: '#004f99',
          800: '#003366',
          900: '#001733',
          950: '#000b1a',
        },

        // Lobster reds
        lobster: {
          50: '#fff1f0',
          100: '#ffe3e1',
          200: '#ffc7c3',
          300: '#ffaba5',
          400: '#ff8f87',
          500: '#ff5347', // Primary lobster red
          600: '#cc4239',
          700: '#99322b',
          800: '#66211c',
          900: '#33110e',
        },

        // Electric teal for AI/tech
        teal: {
          50: '#e6fffa',
          100: '#ccfff5',
          200: '#99ffeb',
          300: '#66ffe0',
          400: '#33ffd6',
          500: '#00ffcc', // Electric teal
          600: '#00cca3',
          700: '#00997a',
          800: '#006652',
          900: '#003329',
        },

        // Convenience aliases
        muted: '#1a2332',
        'muted-foreground': '#94a3b8',
        border: '#1e293b',
        accent: '#00ffcc', // Electric teal
        primary: '#ff5347', // Lobster red
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
