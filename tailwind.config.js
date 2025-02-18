/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        rampPrimary: "#E4F222",
        rampText: "#1A1919",
        rampGray: "#D2CECB",
      },
    },
  },
  plugins: [],
};
