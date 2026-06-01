import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gitlab: {
          orange: '#FC6D26',
          'orange-dark': '#e04e00',
          blue: '#1068bf',
          'blue-dark': '#0b5cad',
          'bg-light': '#fafafa',
          'bg-lighter': '#f9f9f9',
          'border': '#dbdbdb',
          'border-light': '#e5e5e5',
          'text-primary': '#303030',
          'text-secondary': '#525252',
          'text-tertiary': '#707070',
          'sidebar-bg': '#fafafa',
          'topbar-bg': '#ffffff',
          'hover': '#f0f0f0',
        },
      },
      borderRadius: {
        'gitlab': '4px',
        'gitlab-lg': '6px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Noto Sans', 'Ubuntu', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
