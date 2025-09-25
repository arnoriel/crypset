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
    },
  },
};