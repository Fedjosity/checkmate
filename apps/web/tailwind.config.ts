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
        background: '#0A0B0F',
        surface: '#0D1017',
        border: '#1A1F2E',
        gold: {
          DEFAULT: '#C9A84C',
          dim: '#7D6530',
        },
        white: '#F0F0EE',
        muted: '#6B7280',
        success: '#22C55E',
        error: '#EF4444',
      },
    },
  },
  plugins: [],
};
export default config;
