// ============================================
// BIKEWO — TAILWIND PRESET
// Shared Tailwind configuration with brand colors
// Source: BikeWo Brand Guidelines v1.0
// ============================================

const { brandColors, brandGradients, brandShadows } = require('./src/brand/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: brandColors.primary,
          indigo: brandColors.indigo,
          dark: brandColors.dark[900],
          light: brandColors.light[50],
          white: brandColors.white,
          midnight: brandColors.midnight,
          charge: brandColors.charge,
          ink: brandColors.ink,
          slate: brandColors.slate,
          mist: brandColors.mist,
          cloud: brandColors.cloud,
          foreground: brandColors.indigo,
          'text-light': brandColors.slate,
          'text-muted': '#918FAE',
          border: '#D3D2DF',
          hover: '#EDEDF2',
        },

        // Action palette — green ramp (existing UI uses orange-* for primary actions)
        orange: brandColors.orange,
        green: brandColors.green,
        yellow: brandColors.yellow,
        dark: brandColors.dark,
        light: brandColors.light,
        indigo: {
          DEFAULT: brandColors.indigo,
          ...brandColors.indigoRamp,
        },
      },

      backgroundImage: {
        'gradient-brand': brandGradients.primary,
        'gradient-orange': brandGradients.orange,
        'gradient-sunset': brandGradients.sunset,
        'gradient-warm': brandGradients.warm,
        'gradient-dark': brandGradients.dark,
        'gradient-light': brandGradients.light,
        'gradient-vibrant': brandGradients.vibrant,
        'gradient-glass': brandGradients.glass,
        'gradient-glass-orange': brandGradients.glassOrange,
      },

      boxShadow: {
        brand: brandShadows.brand,
        'brand-lg': brandShadows.brandLg,
        'brand-sm': brandShadows.brandSm,
        dark: brandShadows.dark,
        'dark-lg': brandShadows.darkLg,
        soft: brandShadows.soft,
      },

      // Fonts unchanged — Host Grotesk for apps; Jura for landing
      fontFamily: {
        sans: ['Host Grotesk', 'system-ui', 'sans-serif'],
        heading: ['Host Grotesk', 'system-ui', 'sans-serif'],
        jura: ['Jura', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
};
