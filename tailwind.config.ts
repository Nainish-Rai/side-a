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
        "walkman-dark": "#1a1a1a",
        "walkman-orange": "#ff6b35",
        "walkman-yellow": "#ffd23f",
      },
    },
  },
  plugins: [],
} satisfies Config;
