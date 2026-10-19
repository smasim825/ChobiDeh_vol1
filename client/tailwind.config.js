/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#005C55",
          container: "#0F766E",
          dark: "#0D645E",
          fixed: "#9CF2E8",
          "fixed-dim": "#80D5CB",
        },
        "on-primary": "#FFFFFF",
        "on-primary-container": "#A3FAEF",
        secondary: {
          DEFAULT: "#8E4E14",
          accent: "#F4A261",
          container: "#FFAB69",
        },
        "on-secondary": "#FFFFFF",
        "on-secondary-container": "#783D01",
        tertiary: {
          DEFAULT: "#005E3F",
          container: "#007952",
        },
        background: "#F8F5EF",
        "warm-ivory": "#F8F5EF",
        charcoal: {
          DEFAULT: "#253331",
          muted: "#6E7977",
          dark: "#101E1C",
        },
        surface: {
          DEFAULT: "#EDFDF9",
          dim: "#CDDDDA",
          bright: "#EDFDF9",
          "container-lowest": "#FFFFFF",
          "container-low": "#E7F7F4",
          container: "#E1F1EE",
          "container-high": "#DCECE8",
          "container-highest": "#D6E6E2",
        },
        "on-surface": "#101E1C",
        "on-surface-variant": "#3E4947",
        "inverse-surface": "#253331",
        "inverse-on-surface": "#E4F4F1",
        outline: {
          DEFAULT: "#6E7977",
          variant: "#BDC9C6",
          soft: "#E2DDD4",
        },
        border: {
          soft: "#E6E1D8",
          subtle: "#E2DDD4",
        },
        error: {
          DEFAULT: "#BA1A1A",
          container: "#FFDAD6",
          text: "#93000A",
        },
      },
      fontFamily: {
        sans: ["Manrope", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        manrope: ["Manrope", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        card: "0px 2px 8px rgba(37, 51, 49, 0.04)",
        dock: "0px 8px 24px rgba(37, 51, 49, 0.08), 0px 2px 6px rgba(37, 51, 49, 0.04)",
      },
    },
  },
  plugins: [],
}
