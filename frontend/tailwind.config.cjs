module.exports = {
  purge: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#050807',
        surface: 'rgba(17,28,27,.72)',
        accent: '#8df4cb',
        accent2: '#6dc8ff',
      },
      boxShadow: {
        glow: '0 18px 60px rgba(141,244,203,0.16)',
      },
    },
  },
  plugins: [],
};
