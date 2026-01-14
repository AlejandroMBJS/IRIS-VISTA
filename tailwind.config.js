/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
          dark: '#2D363F',
          light: '#80959A',
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
          blue: '#4E616F',
          teal: '#80959A',
          orange: '#E95F20',
          green: '#ABC0B9',
          yellow: '#F38756',
          red: '#AA2F0D',
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        surface: '#FFFFFF',
        text: {
          DEFAULT: '#2D363F',
          secondary: '#4E616F',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      letterSpacing: {
        'tight': '-0.02em',
        'tighter': '-0.03em',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(45, 54, 63, 0.06)',
        'soft-md': '0 4px 16px rgba(45, 54, 63, 0.08)',
        'soft-lg': '0 8px 24px rgba(45, 54, 63, 0.1)',
        'soft-xl': '0 12px 48px rgba(45, 54, 63, 0.12)',
        'inner-soft': 'inset 0 2px 4px rgba(45, 54, 63, 0.04)',
        'glow': '0 0 20px rgba(92, 47, 14, 0.15)',
        'glow-lg': '0 0 40px rgba(92, 47, 14, 0.2)',
        'card': '0 1px 3px rgba(45, 54, 63, 0.04), 0 4px 12px rgba(45, 54, 63, 0.04)',
        'card-hover': '0 4px 12px rgba(45, 54, 63, 0.06), 0 12px 24px rgba(45, 54, 63, 0.08)',
        'button': '0 1px 2px rgba(45, 54, 63, 0.06), 0 2px 4px rgba(45, 54, 63, 0.04)',
        'button-hover': '0 2px 4px rgba(45, 54, 63, 0.08), 0 4px 8px rgba(45, 54, 63, 0.06)',
        'input': '0 1px 2px rgba(45, 54, 63, 0.04)',
        'input-focus': '0 0 0 3px rgba(92, 47, 14, 0.1), 0 1px 2px rgba(45, 54, 63, 0.08)',
        'dropdown': '0 4px 12px rgba(45, 54, 63, 0.08), 0 12px 24px rgba(45, 54, 63, 0.12)',
        'modal': '0 8px 32px rgba(45, 54, 63, 0.12), 0 24px 64px rgba(45, 54, 63, 0.16)',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-subtle': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-premium': 'linear-gradient(135deg, #5C2F0E 0%, #2D363F 100%)',
        'gradient-premium-light': 'linear-gradient(135deg, rgba(92, 47, 14, 0.1) 0%, rgba(45, 54, 63, 0.1) 100%)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
