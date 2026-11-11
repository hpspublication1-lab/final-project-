/**
 * Samyak Tutor Design System Tokens
 * Master token specifications for the world-class international educational platform.
 * Adheres to 8-point spatial grid, semantic color theory, and WCAG 2.2 AA accessibility.
 */

export const DESIGN_TOKENS = {
  // ── 1. Color Palette ────────────────────────────────────────────────────────
  colors: {
    brand: {
      primary: '#5243E0',         // Samyak Royal Indigo (Primary brand action)
      primaryHover: '#4334CD',    // Hover state
      primaryActive: '#3729B5',   // Pressed state
      primaryLight: '#EEEDFE',    // Primary tint / secondary surface
      primaryDark: '#2C209A',
      primaryRgb: '82, 67, 224',

      // Dark Mode Brand Tokens
      darkPrimary: '#8176FF',     // High-contrast primary on dark surfaces
      darkPrimaryHover: '#958CFF',
      darkPrimaryLight: '#181C30',
      darkPrimaryRgb: '129, 118, 255',
    },
    accent: {
      teal: '#00BFA5',           // Innovation / AI highlight
      tealHover: '#00A891',
      tealLight: '#E0F7F4',
      darkTeal: '#00E5CC',
      darkTealLight: '#072422',

      gold: '#F59E0B',           // Streaks / Awards / Leaderboards
      goldLight: '#FFFBEB',
      darkGold: '#FBBF24',
      darkGoldLight: '#2A1C02',
    },
    neutral: {
      light: {
        background: '#F8FAFC',    // App background (Slate 50)
        surface: '#FFFFFF',       // Card / Modal / Popover surface
        surfaceMuted: '#F1F4F9',  // Secondary card / Input background
        border: '#E2E6F0',        // Subtle card / divider border
        borderFocus: '#5243E0',   // Focused input border
        textPrimary: '#090D1A',   // 95% black for highest legibility
        textSecondary: '#4A5568', // Secondary descriptions
        textMuted: '#718096',     // Captions / timestamps
        textDisabled: '#A0AEC0',
      },
      dark: {
        background: '#07090E',    // Deep obsidian background
        surface: '#0D111C',       // Elevated surface
        surfaceMuted: '#131828',  // Input / secondary card
        border: '#1D2438',        // High-contrast dark border
        borderFocus: '#8176FF',
        textPrimary: '#F1F4FA',   // Crisp white
        textSecondary: '#A0AEC0', // Secondary readable text
        textMuted: '#718096',     // Captions
        textDisabled: '#4A5568',
      },
    },
    semantic: {
      success: {
        DEFAULT: '#10B981',
        light: '#ECFDF5',
        dark: '#059669',
        border: '#A7F3D0',
        text: '#065F46',
      },
      error: {
        DEFAULT: '#EF4444',
        light: '#FEF2F2',
        dark: '#DC2626',
        border: '#FECACA',
        text: '#991B1B',
      },
      warning: {
        DEFAULT: '#F59E0B',
        light: '#FFFBEB',
        dark: '#D97706',
        border: '#FDE68A',
        text: '#92400E',
      },
      info: {
        DEFAULT: '#3B82F6',
        light: '#EFF6FF',
        dark: '#2563EB',
        border: '#BFDBFE',
        text: '#1E40AF',
      },
    },
    subjects: {
      biology: {
        DEFAULT: '#10B981',
        light: '#ECFDF5',
        darkLight: '#032A18',
        label: 'Biology',
      },
      chemistry: {
        DEFAULT: '#8B5CF6',
        light: '#F5F3FF',
        darkLight: '#1A0B33',
        label: 'Chemistry',
      },
      physics: {
        DEFAULT: '#3B82F6',
        light: '#EFF6FF',
        darkLight: '#08162E',
        label: 'Physics',
      },
      mat: {
        DEFAULT: '#F59E0B',
        light: '#FFFBEB',
        darkLight: '#261A02',
        label: 'Mental Agility',
      },
      mathematics: {
        DEFAULT: '#EC4899',
        light: '#FDF2F8',
        darkLight: '#2C0617',
        label: 'Mathematics',
      },
      english: {
        DEFAULT: '#14B8A6',
        light: '#F0FDFA',
        darkLight: '#042F2E',
        label: 'English',
      },
    },
  },

  // ── 2. Typography Scale ─────────────────────────────────────────────────────
  typography: {
    fonts: {
      sans: 'var(--font-plus-jakarta-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Mukta", sans-serif',
      mono: 'var(--font-ibm-plex-mono), "IBM Plex Mono", "SF Mono", Consolas, monospace',
      nepaliFallback: '"Mukta", "Preeti", "Kalimati", sans-serif',
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    sizes: {
      xs: { size: '0.75rem', lineHeight: '1rem', tracking: '0.01em' },        // 12px
      sm: { size: '0.875rem', lineHeight: '1.25rem', tracking: '0em' },       // 14px
      base: { size: '1rem', lineHeight: '1.5rem', tracking: '-0.01em' },      // 16px
      lg: { size: '1.125rem', lineHeight: '1.75rem', tracking: '-0.015em' },  // 18px
      xl: { size: '1.25rem', lineHeight: '1.75rem', tracking: '-0.02em' },    // 20px
      '2xl': { size: '1.5rem', lineHeight: '2rem', tracking: '-0.025em' },     // 24px
      '3xl': { size: '1.875rem', lineHeight: '2.25rem', tracking: '-0.03em' }, // 30px
      '4xl': { size: '2.25rem', lineHeight: '2.5rem', tracking: '-0.035em' },  // 36px
      '5xl': { size: '3rem', lineHeight: '1.15', tracking: '-0.04em' },        // 48px
    },
  },

  // ── 3. Spacing Scale (8-Point Grid) ─────────────────────────────────────────
  spacing: {
    0: '0px',
    0.5: '2px',   // Micro spacer
    1: '4px',     // Half unit
    1.5: '6px',
    2: '8px',     // 1 Unit (Base)
    2.5: '10px',
    3: '12px',    // 1.5 Units
    4: '16px',    // 2 Units
    5: '20px',    // 2.5 Units
    6: '24px',    // 3 Units
    8: '32px',    // 4 Units
    10: '40px',   // 5 Units
    12: '48px',   // 6 Units
    16: '64px',   // 8 Units
    20: '80px',   // 10 Units
    24: '96px',   // 12 Units
  },

  // ── 4. Border Radii Scale ───────────────────────────────────────────────────
  radii: {
    none: '0px',
    xs: '4px',    // Small tags
    sm: '8px',    // Inputs, dropdown items, tooltips
    md: '12px',   // Buttons, compact cards, table rows
    lg: '16px',   // Standard content cards, modals
    xl: '20px',   // Hero banners, bottom sheets
    '2xl': '24px',// Major container sections
    full: '9999px',// Pills, circular avatars, counters
  },

  // ── 5. Layered Elevation & Shadows ──────────────────────────────────────────
  shadows: {
    none: 'none',
    xs: '0 1px 2px rgba(9, 13, 26, 0.04)',
    sm: '0 2px 4px rgba(9, 13, 26, 0.04), 0 4px 12px rgba(9, 13, 26, 0.05)',
    md: '0 4px 8px rgba(9, 13, 26, 0.04), 0 12px 28px rgba(9, 13, 26, 0.08)',
    lg: '0 8px 16px rgba(9, 13, 26, 0.05), 0 24px 56px rgba(9, 13, 26, 0.12)',
    luxury: '0 0 0 1px rgba(9, 13, 26, 0.06), 0 8px 24px -4px rgba(82, 67, 224, 0.12), 0 20px 48px -8px rgba(9, 13, 26, 0.08)',
    primaryGlow: '0 0 24px rgba(82, 67, 224, 0.25)',
    darkElevation: '0 0 0 1px rgba(255, 255, 255, 0.08), 0 8px 32px -4px rgba(0, 0, 0, 0.8), 0 0 40px -10px rgba(129, 118, 255, 0.15)',
  },

  // ── 6. Motion & Animation Tokens ────────────────────────────────────────────
  motion: {
    durations: {
      instant: '75ms',
      fast: '150ms',      // Hover, button presses, focus rings
      normal: '220ms',    // Dropdowns, modals, tab switches
      slow: '350ms',      // Drawers, full-page transitions
    },
    easings: {
      standard: 'cubic-bezier(0.2, 0, 0, 1)',       // Decelerated entrance
      smoothOut: 'cubic-bezier(0.16, 1, 0.3, 1)',   // Ultra-crisp Apple/Linear curve
      spring: { type: 'spring', stiffness: 350, damping: 28 },
      bounce: { type: 'spring', stiffness: 450, damping: 18 },
    },
  },

  // ── 7. Layout & Component Dimensions ────────────────────────────────────────
  dimensions: {
    headerHeight: '64px',
    mobileBottomNavHeight: '68px',
    sidebarWidthExpanded: '260px',
    sidebarWidthCollapsed: '72px',
    contentMaxWidth: '1440px',
    minTapTarget: '44px',     // WCAG 2.2 touch target compliance
  },

  // ── 8. Breakpoints ──────────────────────────────────────────────────────────
  breakpoints: {
    xs: '360px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // ── 9. Z-Index Hierarchy ────────────────────────────────────────────────────
  zIndex: {
    base: 0,
    dropdown: 20,
    stickyHeader: 30,
    mobileBottomNav: 40,
    drawer: 50,
    modalBackdrop: 60,
    modalContent: 70,
    toast: 80,
    proctorWatermark: 90,
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
