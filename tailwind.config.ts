import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        royal: {
          maroon: "#590d22",   // Deep regal red
          gold: "#c5a059",     // Muted, antique gold
          cream: "#fdfbf7",    // Paper/Parchment white
          dark: "#1a1510",     // Warm black
          accent: "#8c2f39",   // Lighter maroon for hovers
        }
      },
      fontFamily: {
        heading: ['var(--font-cinzel)'], // For Titles
        body: ['var(--font-lato)'],      // For Reading text
      },
      backgroundImage: {
        'royal-pattern': "url('https://www.transparenttextures.com/patterns/cream-paper.png')", // Subtle texture
      }
    },
  },
  plugins: [],
};
export default config;