module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
        bg: 'var(--color-bg)',
        text: 'var(--color-text)',
      }
    }
  }
}
