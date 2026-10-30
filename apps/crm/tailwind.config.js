/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../packages/config/tailwind.preset')],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/utils/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/feedback/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/themes/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2AB77C',
          indigo: '#241F5D',
          dark: '#241F5D',
          light: '#F1F1F5',
          white: '#FFFFFF',
          midnight: '#14113A',
          charge: '#35D68F',
          foreground: '#241F5D',
          'text-light': '#4A4869',
          'text-muted': '#918FAE',
          border: '#D3D2DF',
          hover: '#EDEDF2',
          slate: '#4A4869',
        },
      },
      fontFamily: {
        sans: ['Host Grotesk', 'system-ui', 'sans-serif'],
        primary: ['Host Grotesk', 'system-ui', 'sans-serif'],
        heading: ['Host Grotesk', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #FFFFFF 0%, #F1F1F5 100%)',
        'gradient-card': 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
      },
      boxShadow: {
        card: '0 2px 8px 0 rgba(36, 31, 93, 0.06)',
        'card-hover': '0 12px 32px 0 rgba(36, 31, 93, 0.12)',
        soft: '0 2px 8px rgba(36, 31, 93, 0.06)',
      },
    },
  },
  plugins: [],
}
