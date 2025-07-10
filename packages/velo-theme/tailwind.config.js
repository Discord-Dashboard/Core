/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/components/**/*.{js,ts,jsx,tsx}',
        './src/pages/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Space Grotesk','sans-serif']
            },
            animation: {
                'pulse-slow': 'pulse 6s infinite'
            }
        }
    },
    plugins: []
}