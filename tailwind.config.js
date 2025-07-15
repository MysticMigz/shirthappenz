module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#FF1744',
          blue: '#2979FF',
          black: '#000000',
          white: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
}; 