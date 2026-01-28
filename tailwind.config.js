/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Light Mode - Warm Cream Palette
        cream: {
          50: "#FFFDFB",
          100: "#FDFBF7",
          200: "#FAF6EF",
          300: "#F5EEE3",
          400: "#EDE3D3",
          500: "#E2D4BF",
          600: "#C9B89A",
          700: "#A69474",
          800: "#7D6D54",
          900: "#544835",
        },
        // Dark Mode - Rich Espresso/Forest
        espresso: {
          50: "#F5F3F0",
          100: "#E8E4DD",
          200: "#D1C9BC",
          300: "#B5A896",
          400: "#8D7D66",
          500: "#5C4D3C",
          600: "#3D352B",
          700: "#2A2520",
          800: "#1E1B17",
          900: "#15120F",
          950: "#0D0B09",
        },
        // Accent Colors - Soft Warm Gradients
        accent: {
          coral: "#F4A28C",
          peach: "#FCCDB6",
          blush: "#F8D4D4",
          sage: "#B5C4B1",
          moss: "#8B9D77",
          sand: "#D4C5A9",
          terracotta: "#C67D5E",
          rose: "#E8B4B4",
        },
        // Semantic Colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        // Sharp/Runic display font for brand & headings
        display: ["var(--font-cinzel)", "Cinzel", "serif"],
        // Elegant serif for secondary text
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        // Clean sans-serif for body
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(3rem, 10vw, 8rem)", { lineHeight: "1", letterSpacing: "0.05em" }],
        "display-lg": ["clamp(2.5rem, 6vw, 5rem)", { lineHeight: "1.1", letterSpacing: "0.04em" }],
        "display-md": ["clamp(2rem, 4vw, 3.5rem)", { lineHeight: "1.15", letterSpacing: "0.03em" }],
        "display-sm": ["clamp(1.5rem, 3vw, 2rem)", { lineHeight: "1.2", letterSpacing: "0.02em" }],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.04), 0 10px 20px -2px rgba(0, 0, 0, 0.02)",
        "soft-lg": "0 10px 40px -10px rgba(0, 0, 0, 0.08), 0 20px 25px -5px rgba(0, 0, 0, 0.03)",
        "soft-xl": "0 25px 50px -12px rgba(0, 0, 0, 0.12)",
        glow: "0 0 40px rgba(244, 162, 140, 0.15)",
        "inner-soft": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-warm": "linear-gradient(135deg, var(--tw-gradient-stops))",
        "gradient-soft": "linear-gradient(180deg, var(--tw-gradient-stops))",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out forwards",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        "slide-in-right": "slide-in-right 0.6s ease-out forwards",
        "scale-in": "scale-in 0.5s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
      },
      transitionDuration: {
        400: "400ms",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
