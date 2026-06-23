import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary, #4F46E5)',
        secondary: '#7C3AED',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        text: '#111827',
        muted: '#6B7280',
        ink: '#182032',
        linen: '#F7F4EC',
        olive: '#6F7D4C',
      },
      fontFamily: {
        sans: ['Nunito Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 18px 50px rgba(24, 32, 50, 0.08)',
        panel: '0 1px 2px rgba(17, 24, 39, 0.06)',
        app: '0 22px 70px rgba(24, 32, 50, 0.12)',
      },
      backgroundImage: {
        'paper-grid':
          'linear-gradient(rgba(79, 70, 229, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(79, 70, 229, 0.08) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
} satisfies Config;
