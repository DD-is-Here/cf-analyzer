/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#07111f',
        panel: '#0e1a2d',
        line: '#264461',
        accent: '#58d4ff',
        brandAmber: '#ffc469'
      },
      boxShadow: {
        panel: '0 20px 45px rgba(2, 8, 20, 0.55)'
      }
    }
  },
  plugins: []
};
