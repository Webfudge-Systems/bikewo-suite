/**
 * Theme color configuration
 * BikeWo Brand Guidelines v1.0
 */

export const colors = {
  brand: {
    primary: '#2AB77C', // BikeWo Green — CTAs
    secondary: '#241F5D', // BikeWo Indigo — structure
    accent: '#35D68F', // Charge Green

    gradientStart: '#241F5D',
    gradientEnd: '#2AB77C',

    foreground: '#241F5D',
    textLight: '#4A4869', // Slate
    textDark: '#14122B', // Ink

    background: '#FFFFFF',
    hover: '#EEF9F5',
    border: '#D3D2DF',
  },

  status: {
    new: {
      bg: '#dbeafe',
      text: '#1e3a8a',
      border: '#60a5fa',
      shadow: '#93c5fd',
    },
    contacted: {
      bg: '#fef3c7',
      text: '#78350f',
      border: '#fbbf24',
      shadow: '#fcd34d',
    },
    qualified: {
      bg: '#D4F1E5',
      text: '#14603F',
      border: '#55C596',
      shadow: '#AAE2CB',
    },
    lost: {
      bg: '#fee2e2',
      text: '#991b1b',
      border: '#E2574C',
      shadow: '#fca5a5',
    },
    converted: {
      bg: '#D4F1E5',
      text: '#14603F',
      border: '#2AB77C',
      shadow: '#7FD4B0',
    },
  },

  companyType: {
    'startup-corporate': {
      bg: '#D4F1E5',
      text: '#14603F',
      border: '#55C596',
      shadow: '#AAE2CB',
      label: 'Startup and Corporates',
    },
    investor: {
      bg: '#EDEDF2',
      text: '#241F5D',
      border: '#7C799E',
      shadow: '#D3D2DF',
      label: 'Investors',
    },
    'enablers-academia': {
      bg: '#AAE2CB',
      text: '#14603F',
      border: '#2AB77C',
      shadow: '#7FD4B0',
      label: 'Enablers & Academia',
    },
  },

  ui: {
    border: '#D3D2DF',
    borderLight: '#EDEDF2',
    hover: '#F1F1F5',
    focus: '#2AB77C',
    disabled: '#918FAE',
    divider: '#D3D2DF',
  },

  feedback: {
    success: {
      bg: '#D4F1E5',
      text: '#14603F',
      border: '#55C596',
    },
    error: {
      bg: '#fee2e2',
      text: '#991b1b',
      border: '#E2574C',
    },
    warning: {
      bg: '#FFF8EB',
      text: '#A66C1A',
      border: '#F2A93B',
    },
    info: {
      bg: '#E0F7FA',
      text: '#0E7490',
      border: '#1FA6B8',
    },
  },
};

export default colors;
