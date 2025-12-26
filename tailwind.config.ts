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
        bone: "#f2efe9",
        carbon: "#101010",
        "walkman-orange": "#ff6b35",
        "walkman-yellow": "#ffd23f",
      },
      letterSpacing: {
        widest: "0.15em",
      },
    },
  },
  plugins: [],
} satisfies Config;
