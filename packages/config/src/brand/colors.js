// ============================================
// BIKEWO — OFFICIAL BRAND COLORS
// Source: BikeWo Brand Guidelines v1.0 (2026)
// ============================================

/**
 * Primary palette
 * - Indigo #241F5D — structure, type, dark surfaces
 * - Green  #2AB77C — energy, action, accent, CTA
 *
 * Support
 * - Midnight #14113A — deepest surfaces
 * - Charge Green #35D68F — screen highlights / active peaks
 * - Cloud #F1F1F5 — default light surface
 * - White #FFFFFF
 *
 * Accessibility
 * - Green text on white → Green 700 #17754F only
 * - Primary button label → Indigo on Green (never white on green)
 */

const brandColors = {
  // Semantic brand tokens
  primary: '#2AB77C', // BikeWo Green — CTAs / accents
  indigo: '#241F5D', // BikeWo Indigo — structure / type
  white: '#FFFFFF',
  midnight: '#14113A',
  charge: '#35D68F',
  ink: '#14122B',
  slate: '#4A4869',
  mist: '#C8C7D6',
  cloud: '#F1F1F5',

  // Action / CTA ramp (mapped onto Tailwind `orange-*` for existing UI classes)
  orange: {
    50: '#EEF9F5',
    100: '#D4F1E5',
    200: '#AAE2CB',
    300: '#7FD4B0',
    400: '#55C596',
    500: '#2AB77C', // BASE green — primary CTA surface
    600: '#229666',
    700: '#17754F', // text-safe green on white
    800: '#14603F',
    900: '#0F4A30',
  },

  green: {
    50: '#EEF9F5',
    100: '#D4F1E5',
    200: '#AAE2CB',
    300: '#7FD4B0',
    400: '#55C596',
    500: '#2AB77C', // BASE
    600: '#229666',
    700: '#17754F', // TEXT-SAFE
    800: '#14603F',
    900: '#0F4A30',
  },

  indigoRamp: {
    50: '#F7F7FA',
    100: '#EDEDF2',
    200: '#D3D2DF',
    300: '#A7A5BE',
    400: '#7C799E',
    500: '#504C7D',
    600: '#504C7D',
    700: '#322B7A',
    800: '#241F5D', // BASE
    900: '#1E194C',
    950: '#14113A', // Midnight
  },

  // Kept for gradient/complement usage; Solar Amber is a division signal colour
  yellow: {
    50: '#FFF8EB',
    100: '#FDECC8',
    200: '#FBD89A',
    300: '#F8C46C',
    400: '#F5B54E',
    500: '#F2A93B', // Solar Amber (division / chart only)
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
    600: '#4A4869', // Slate
    700: '#322B7A',
    800: '#1E194C',
    900: '#241F5D', // BikeWo Indigo
  },

  light: {
    50: '#F1F1F5', // Cloud — primary light surface
    100: '#EDEDF2',
    200: '#D3D2DF',
    300: '#C8C7D6', // Mist
    400: '#A7A5BE',
    500: '#918FAE',
    600: '#7C799E',
    700: '#504C7D',
    800: '#322B7A',
    900: '#241F5D',
  },
};

const brandGradients = {
  primary: 'linear-gradient(100deg, #241F5D 0%, #2AB77C 100%)', // Electric Flow
  orange: 'linear-gradient(100deg, #2AB77C 0%, #35D68F 100%)', // Charge
  sunset: 'linear-gradient(100deg, #241F5D 0%, #2AB77C 50%, #35D68F 100%)',
  warm: 'linear-gradient(135deg, #EDEDF2 0%, #F1F1F5 100%)',
  dark: 'linear-gradient(100deg, #14113A 0%, #241F5D 100%)', // Night
  light: 'linear-gradient(135deg, #FFFFFF 0%, #F1F1F5 100%)',
  vibrant: 'linear-gradient(100deg, #2AB77C 0%, #35D68F 100%)',
  glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(241, 241, 245, 0.7) 100%)',
  glassOrange: 'linear-gradient(135deg, rgba(42, 183, 124, 0.2) 0%, rgba(53, 214, 143, 0.1) 100%)',
};

const brandShadows = {
  brand: '0 4px 14px 0 rgba(42, 183, 124, 0.25)',
  brandLg: '0 10px 40px 0 rgba(42, 183, 124, 0.2)',
  brandSm: '0 2px 8px 0 rgba(42, 183, 124, 0.15)',
  dark: '0 2px 8px 0 rgba(36, 31, 93, 0.06)', // shadow-card
  darkLg: '0 12px 32px 0 rgba(36, 31, 93, 0.12)', // shadow-lift
  soft: '0 2px 8px rgba(36, 31, 93, 0.06)',
};

const brandUsage = {
  primary: {
    color: '#2AB77C',
    use: 'CTAs, highlights, active states, key data',
    avoid: 'Body text on white (use Green 700 #17754F); never white labels on green buttons',
  },
  dark: {
    color: '#241F5D',
    use: 'Headers, navigation, dark panels, button labels on green',
    avoid: 'Large decorative fills without contrast check',
  },
  light: {
    color: '#F1F1F5',
    use: 'Page backgrounds, cards, section breaks',
    avoid: 'Text (low contrast)',
  },
};

const getTailwindColors = () => ({
  brand: {
    primary: brandColors.primary,
    indigo: brandColors.indigo,
    dark: brandColors.indigo,
    light: brandColors.cloud,
    white: brandColors.white,
    midnight: brandColors.midnight,
    charge: brandColors.charge,
    ink: brandColors.ink,
    slate: brandColors.slate,
    mist: brandColors.mist,
    cloud: brandColors.cloud,
  },
  orange: brandColors.orange,
  green: brandColors.green,
  yellow: brandColors.yellow,
  dark: brandColors.dark,
});

module.exports = {
  brandColors,
  brandGradients,
  brandShadows,
  brandUsage,
  getTailwindColors,
};

module.exports.default = brandColors;
