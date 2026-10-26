import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        oljim: {
          black: '#0A0A0A',
          green: '#0F766E',
          line: '#E5E7EB',
          muted: '#6B7280',
          soft: '#F7F7F8',
          orange: '#F59E0B',
          red: '#EF4444'
        },
      },
      boxShadow: {
        card: '0 6px 24px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        xl2: '1.25rem',
      }
    },
  },
  plugins: [],
};

export default config;
