const primeui = require('tailwindcss-primeui');

/** Colors / radius / typography reference CSS variables in src/styles.css */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)'
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          foreground: 'rgb(var(--color-secondary-foreground) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          foreground: 'rgb(var(--color-accent-foreground) / <alpha-value>)'
        },
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)'
        },
        overlay: 'rgb(var(--color-overlay) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        subtle: 'rgb(var(--color-subtle) / <alpha-value>)',
        inverse: 'rgb(var(--color-inverse) / <alpha-value>)',
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          strong: 'rgb(var(--color-border-strong) / <alpha-value>)'
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          foreground: 'rgb(var(--color-success-foreground) / <alpha-value>)'
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          foreground: 'rgb(var(--color-warning-foreground) / <alpha-value>)'
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          foreground: 'rgb(var(--color-danger-foreground) / <alpha-value>)'
        },
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
          foreground: 'rgb(var(--color-info-foreground) / <alpha-value>)'
        },
        focus: 'rgb(var(--color-focus-ring) / <alpha-value>)',
        sidebar: {
          DEFAULT: 'rgb(var(--color-sidebar) / <alpha-value>)',
          foreground: 'rgb(var(--color-sidebar-foreground) / <alpha-value>)',
          muted: 'rgb(var(--color-sidebar-muted) / <alpha-value>)',
          active: 'rgb(var(--color-sidebar-active) / <alpha-value>)',
          hover: 'rgb(var(--color-sidebar-hover) / <alpha-value>)',
          border: 'rgb(var(--color-sidebar-border) / <alpha-value>)',
          tooltip: 'rgb(var(--color-sidebar-tooltip) / <alpha-value>)',
          'tooltip-foreground': 'rgb(var(--color-sidebar-tooltip-foreground) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)']
      },
      fontSize: {
        display: ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        h1: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        h2: ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        h3: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        h4: ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        body: ['var(--font-size-body)', { lineHeight: 'var(--line-height-body)' }],
        'body-sm': ['var(--font-size-body-sm)', { lineHeight: 'var(--line-height-body-sm)' }],
        caption: ['var(--font-size-caption)', { lineHeight: 'var(--line-height-caption)' }],
        overline: ['0.65rem', { lineHeight: '1rem', letterSpacing: '0.08em', fontWeight: '600' }]
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)'
      },
      spacing: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-width-collapsed)'
      },
      width: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-width-collapsed)'
      },
      margin: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-width-collapsed)'
      },
      zIndex: {
        sidebar: '40',
        toolbar: '10',
        modal: '50',
        tooltip: '50'
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(var(--color-overlay) / 0.05)',
        md: '0 4px 6px -1px rgb(var(--color-overlay) / 0.1), 0 2px 4px -2px rgb(var(--color-overlay) / 0.1)',
        lg: '0 10px 15px -3px rgb(var(--color-overlay) / 0.1), 0 4px 6px -4px rgb(var(--color-overlay) / 0.1)'
      }
    }
  },
  plugins: [primeui]
};
