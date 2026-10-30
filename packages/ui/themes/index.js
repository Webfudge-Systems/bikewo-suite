// ============================================
// BIKEWO — BRAND THEME
// Official Brand Colors & Design Tokens
// Source: BikeWo Brand Guidelines v1.0
// ============================================

export const colors = {
  // Brand primary action — BikeWo Green
  brand: {
    50: '#EEF9F5',
    100: '#D4F1E5',
    200: '#AAE2CB',
    300: '#7FD4B0',
    400: '#55C596',
    500: '#2AB77C',
    600: '#229666',
    700: '#17754F',
    800: '#14603F',
    900: '#0F4A30',
  },

  // Mapped action palette (Tailwind orange-* → green ramp)
  orange: {
    50: '#EEF9F5',
    100: '#D4F1E5',
    200: '#AAE2CB',
    300: '#7FD4B0',
    400: '#55C596',
    500: '#2AB77C',
    600: '#229666',
    700: '#17754F',
    800: '#14603F',
    900: '#0F4A30',
  },

  green: {
    50: '#EEF9F5',
    100: '#D4F1E5',
    200: '#AAE2CB',
    300: '#7FD4B0',
    400: '#55C596',
    500: '#2AB77C',
    600: '#229666',
    700: '#17754F',
    800: '#14603F',
    900: '#0F4A30',
  },

  indigo: {
    50: '#F7F7FA',
    100: '#EDEDF2',
    200: '#D3D2DF',
    300: '#A7A5BE',
    400: '#7C799E',
    500: '#504C7D',
    600: '#504C7D',
    700: '#322B7A',
    800: '#241F5D',
    900: '#1E194C',
    950: '#14113A',
    DEFAULT: '#241F5D',
  },

  yellow: {
    50: '#FFF8EB',
    100: '#FDECC8',
    200: '#FBD89A',
    300: '#F8C46C',
    400: '#F5B54E',
    500: '#F2A93B',
    600: '#D48F28',
    700: '#A66C1A',
    800: '#7A4E12',
    900: '#52340C',
  },

  dark: {
    50: '#F7F7FA',
    100: '#EDEDF2',
    200: '#D3D2DF',
    300: '#A7A5BE',
    400: '#7C799E',
    500: '#504C7D',
    600: '#4A4869',
    700: '#322B7A',
    800: '#1E194C',
    900: '#241F5D',
  },

  light: {
    50: '#F1F1F5',
    100: '#EDEDF2',
    200: '#D3D2DF',
    300: '#C8C7D6',
    400: '#A7A5BE',
    500: '#918FAE',
    600: '#7C799E',
    700: '#504C7D',
    800: '#322B7A',
    900: '#241F5D',
  },

  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  success: {
    light: '#55C596',
    DEFAULT: '#2AB77C',
    dark: '#17754F',
  },
  warning: {
    light: '#F5B54E',
    DEFAULT: '#F2A93B',
    dark: '#A66C1A',
  },
  error: {
    light: '#ef4444',
    DEFAULT: '#E2574C', // Signal Coral
    dark: '#b91c1c',
  },
  info: {
    light: '#60a5fa',
    DEFAULT: '#1FA6B8', // Grid Cyan
    dark: '#1d4ed8',
  },
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
};

export const typography = {
  fontFamily: {
    sans: ['Host Grotesk', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
};

export default theme;

export {
  booksListTableCardClassName,
  booksKpiCardClassName,
  booksElevatedCardClassName,
} from './booksSurface';
