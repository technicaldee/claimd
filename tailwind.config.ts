import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        outline: "#767683",
        "outline-variant": "#c6c5d4",
        "surface-container-highest": "#e0e3e5",
        "surface-container-high": "#e6e8ea",
        "surface-container": "#eceef0",
        "surface-container-low": "#f2f4f6",
        "surface-container-lowest": "#ffffff",
        surface: "#f7f9fb",
        background: "#f7f9fb",
        primary: "#000b60",
        "primary-container": "#142283",
        "primary-fixed": "#dfe0ff",
        "primary-fixed-dim": "#bcc2ff",
        secondary: "#4c616c",
        "secondary-container": "#cfe6f2",
        "secondary-fixed": "#cfe6f2",
        "secondary-fixed-dim": "#b4cad6",
        tertiary: "#380b00",
        "tertiary-container": "#5c1800",
        "tertiary-fixed": "#ffdbd0",
        "tertiary-fixed-dim": "#ffb59d",
        "on-primary": "#ffffff",
        "on-primary-container": "#8390f2",
        "on-primary-fixed": "#000c62",
        "on-primary-fixed-variant": "#303c9a",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#526772",
        "on-secondary-fixed": "#071e27",
        "on-secondary-fixed-variant": "#354a53",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#e17c5a",
        "on-tertiary-fixed": "#390c00",
        "on-tertiary-fixed-variant": "#7b2e12",
        "on-background": "#191c1e",
        "on-surface": "#191c1e",
        "on-surface-variant": "#454652",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "surface-tint": "#4955b3",
        "surface-bright": "#f7f9fb",
        "surface-dim": "#d8dadc",
        "inverse-surface": "#2d3133",
        "inverse-on-surface": "#eff1f3",
        "inverse-primary": "#bcc2ff"
      },
      borderRadius: {
        lg: "0.25rem",
        xl: "0.75rem"
      },
      fontFamily: {
        headline: ["var(--font-manrope)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        label: ["var(--font-inter)", "sans-serif"]
      },
      boxShadow: {
        editorial: "0 24px 60px -32px rgba(0, 11, 96, 0.35)"
      },
      backgroundImage: {
        "editorial-gradient": "linear-gradient(135deg, #000b60 0%, #142283 100%)"
      }
    }
  },
  plugins: []
};

export default config;
