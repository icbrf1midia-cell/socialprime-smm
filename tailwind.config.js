/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./app/**/*.{js,ts,jsx,tsx}",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#3b82f6", // Premium Blue
                "primary-hover": "#2563eb",
                "background-light": "#f6f7f8",
                "background-dark": "#0B1120", // Darker premium background
                "surface-dark": "#161E2E", // Slightly lighter for cards
                "card-dark": "#1F2937",
                "border-dark": "#374151",
                "text-secondary": "#9CA3AF",
            },
            fontFamily: {
                display: ["Spline Sans", "sans-serif"],
                body: ["Noto Sans", "sans-serif"],
            },
        },
    },
    plugins: [],
}
