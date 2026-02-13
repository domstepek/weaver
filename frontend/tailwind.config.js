/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: 'var(--color-bg-canvas)',
          muted: 'var(--color-bg-canvas-muted)',
        },
        surface: {
          DEFAULT: 'var(--color-bg-surface-1)',
          muted: 'var(--color-bg-surface-2)',
          elevated: 'var(--color-bg-elevated)',
          overlay: 'var(--color-bg-overlay)',
          selected: 'var(--color-bg-selected)',
          accent: 'var(--color-accent-soft)',
          success: 'var(--color-bg-success-soft)',
          warning: 'var(--color-bg-warning-soft)',
          danger: 'var(--color-bg-danger-soft)',
          info: 'var(--color-bg-info-soft)',
        },
        border: {
          DEFAULT: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
          accent: 'var(--color-border-accent)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
          accent: 'var(--color-accent)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          soft: 'var(--color-accent-soft)',
          contrast: 'var(--color-accent-contrast)',
        },
        status: {
          success: 'var(--color-status-success)',
          warning: 'var(--color-status-warning)',
          danger: 'var(--color-status-danger)',
          info: 'var(--color-status-info)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        panel: 'var(--shadow-sm)',
        raised: 'var(--shadow-md)',
        overlay: 'var(--shadow-lg)',
      },
      fontFamily: {
        sans: ['var(--font-family-sans)', 'system-ui', 'sans-serif'],
        ui: ['var(--font-family-ui)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-family-mono)', 'ui-monospace', 'monospace'],
      },
      spacing: {
        rhythm: 'var(--space-4)',
      },
      ringColor: {
        accent: 'var(--focus-ring)',
      },
      opacity: {
        disabled: 'var(--opacity-disabled)',
      },
      // Kept for backwards compatibility while migrating components.
      primary: {
        50: 'var(--color-accent-soft)',
        100: 'var(--color-accent-soft)',
        200: 'var(--color-accent-soft)',
        300: 'var(--color-accent)',
        400: 'var(--color-accent)',
        500: 'var(--color-accent)',
        600: 'var(--color-accent)',
        700: 'var(--color-accent-hover)',
        800: 'var(--color-accent-hover)',
        900: 'var(--color-accent-hover)',
      },
    },
  },
  plugins: [],
};
