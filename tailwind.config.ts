import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f5f5f5",
        foreground: "#1e1e1e",
        primary: "#a26028",
        "primary-foreground": "#ffffff",
        secondary: "#eae7e3",
        muted: "#ecebea",
        "muted-foreground": "#666666",
        accent: "#eee9e4",
        border: "#d6d4d1",
        "border-input": "#ccc7c1",
        ring: "#a26028",
      },
      fontFamily: {
        sans: ["Poppins", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
