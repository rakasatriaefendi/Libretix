import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        panel: "#111111",
        panel2: "#171717",
        accent: "#00d964"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0,217,100,0.25), 0 0 24px rgba(0,217,100,0.08)"
      }
    }
  },
  plugins: []
};

export default config;
