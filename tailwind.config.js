/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '2k': '1620px',
    },
    extend: {
      fontFamily: {
        urbanist: ['var(--font-urbanist)'],
        'blocklyn': ['Blocklyn-Grunge', 'sans-serif'],
        'blocklyn-condensed': ['Blocklyn-Condensed', 'sans-serif']
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        'orange-light': '#FBD2B5',
        'gray-light': '#F5F5F5',
        'rapport-bg': '#FBFBFB',
        dark: '#5D5C5C',
      },
      fontSize: {
        'title': '28px',
        'headline': '32px',
        'paragraph': '18px'
      },
      backgroundImage: {
        'login-bg': "url('/images/background.png')",
      }
    },
  },
  plugins: [],
} 