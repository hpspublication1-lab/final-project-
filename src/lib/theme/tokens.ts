/**
 * Samyak LMS Reusable Design Tokens
 * Establishes consistent visual hierarchy, spacing, colors, and radii across all 4 platforms.
 */

export const SAMYAK_TOKENS = {
  colors: {
    primary: {
      light: '#5A45E8',
      dark: '#7C68FA',
      surface: 'rgba(90, 69, 232, 0.08)',
      border: 'rgba(90, 69, 232, 0.2)',
    },
    seeFlagship: {
      emerald: '#10B981',
      dark: '#059669',
      surface: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.25)',
    },
    ceeFlagship: {
      indigo: '#4F46E5',
      dark: '#4338CA',
      surface: 'rgba(79, 70, 229, 0.08)',
      border: 'rgba(79, 70, 229, 0.25)',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },
  radii: {
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',
  },
  shadows: {
    card: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
    cardHover: '0 12px 32px -4px rgba(0, 0, 0, 0.12)',
    elevated: '0 20px 40px -8px rgba(90, 69, 232, 0.15)',
  },
  transitions: {
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;
