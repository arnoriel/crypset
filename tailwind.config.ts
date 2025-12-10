module.exports = {
  content: ['./app/**/*.{ts,tsx}'],
  darkMode: 'class', // Enable dark mode via class 'dark'
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        neutral: 'var(--neutral)',
        success: 'var(--success)',
        danger: 'var(--danger)',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      transitionProperty: {
        'height': 'height',
      },
      animation: {
        "crypsetAppear": "crypsetAppear 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "modeAppear": "modeAppear 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "fadeOutOverlay": "fadeOutOverlay 0.8s ease-in forwards",
      },
      keyframes: {
        crypsetAppear: {
          "0%": { opacity: "0", transform: "translateY(80px) scale(0.9)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        modeAppear: {
          "0%": { opacity: "0", transform: "translateY(60px)" },
          "70%": { opacity: "1", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeOutOverlay: {
          to: { opacity: "1" },
        },
      },
    },
  },
};