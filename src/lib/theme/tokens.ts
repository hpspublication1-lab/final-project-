/**
 * Samyak CEE — Master Frontend Design Tokens
 * Single source of truth for color scales, typography, spacing, radii, and subject themes.
 * Benchmarked against Linear, Stripe, and Apple design standards.
 */

export const SAMYAK_TOKENS = {
  // Brand & Semantic Colors
  colors: {
    brand: {
      primary: '#5243E0', // Electric Indigo
      primaryDark: '#3726B0',
      primaryLight: '#7C68FA',
      surface: 'rgba(82, 67, 224, 0.08)',
      border: 'rgba(82, 67, 224, 0.2)',
    },
    neutral: {
      backgroundLight: '#F8FAFC',
      backgroundDark: '#07090E',
      cardLight: '#FFFFFF',
      cardDark: '#0D111A',
      borderLight: 'rgba(226, 232, 240, 0.8)',
      borderDark: 'rgba(255, 255, 255, 0.08)',
      textPrimaryLight: '#0F172A',
      textPrimaryDark: '#F8FAFC',
      textMutedLight: '#64748B',
      textMutedDark: '#94A3B8',
    },
    // Medical & Academic Subject Themes (CEE & SEE)
    subjects: {
      biology: {
        name: 'Biology (Zoology & Botany)',
        weightage: '80 Marks (40%)',
        color: '#10B981', // Emerald
        colorDark: '#059669',
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.25)',
      },
      chemistry: {
        name: 'Chemistry (Physical, Organic & Inorganic)',
        weightage: '50 Marks (25%)',
        color: '#2563EB', // Blue
        colorDark: '#1D4ED8',
        bg: 'rgba(37, 99, 235, 0.1)',
        border: 'rgba(37, 99, 235, 0.25)',
      },
      physics: {
        name: 'Physics (Mechanics, Waves, Modern, Electro)',
        weightage: '50 Marks (25%)',
        color: '#F59E0B', // Amber
        colorDark: '#D97706',
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.25)',
      },
      mat: {
        name: 'Mental Agility Test (MAT)',
        weightage: '20 Marks (10%)',
        color: '#8B5CF6', // Purple / Violet
        colorDark: '#7C3AED',
        bg: 'rgba(139, 92, 246, 0.1)',
        border: 'rgba(139, 92, 246, 0.25)',
      },
    },
    // Status & Feedback States
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },

  // 8-Point Spatial Grid
  spacing: {
    '0': '0px',
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '8': '32px',
    '10': '40px',
    '12': '48px',
    '16': '64px',
    '20': '80px',
    '24': '96px',
  },

  // Border Radii
  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',
  },

  // Elevation & Shadows
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    card: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
    cardHover: '0 12px 32px -4px rgba(0, 0, 0, 0.12)',
    elevated: '0 20px 40px -8px rgba(82, 67, 224, 0.15)',
    modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },

  // Z-Index Stacking Context
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    drawer: 300,
    modal: 400,
    popover: 500,
    toast: 600,
    tooltip: 700,
  },

  // Transitions & Physics
  transitions: {
    fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

export type SubjectKey = keyof typeof SAMYAK_TOKENS.colors.subjects;

/**
 * Returns strongly typed subject theme tokens
 */
export function getSubjectTheme(subjectKey: string) {
  const normalized = subjectKey.toLowerCase().trim();
  if (normalized.includes('bio')) return SAMYAK_TOKENS.colors.subjects.biology;
  if (normalized.includes('chem')) return SAMYAK_TOKENS.colors.subjects.chemistry;
  if (normalized.includes('phys')) return SAMYAK_TOKENS.colors.subjects.physics;
  if (normalized.includes('mat') || normalized.includes('agility') || normalized.includes('mental')) {
    return SAMYAK_TOKENS.colors.subjects.mat;
  }
  return SAMYAK_TOKENS.colors.subjects.biology;
}
