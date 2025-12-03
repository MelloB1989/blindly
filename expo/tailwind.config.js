/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0B0B10",
        surface: "#121218",
        "surface-elevated": "#16161B",
        primary: "#7C3AED",
        "primary-gradient-start": "#6B21A8",
        "primary-gradient-end": "#9B6BFF",
        accent: "#8B5CF6",
        muted: "#A6A6B2",
        body: "#E6E6F0",
        success: "#16A34A",
        danger: "#EF4444",
        ai: "#FFD166",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
