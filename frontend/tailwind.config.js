/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "status-new": "#f3f4f6",
        "status-draft": "#fef9c3",
        "status-confirmed": "#dcfce7",
      },
    },
  },
  plugins: [],
};
