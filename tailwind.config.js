/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#977DFF",
          "secondary": "#E1D89F",
          "accent": "#CD8B76",
          "neutral": "#786F68",
          "base-100": "#FCF8F4",
          "info": "#3abff8",
          "success": "#1DD781",
          "warning": "#fde68a",     
          "error": "#f87272",
          ".border-color": {
            "border-color": "#262626"
          }
        },
      },
      {
        dark: {
          "primary": "#977DFF",
          "secondary": "#E1D89F",
          "accent": "#CD8B76",
          "neutral": "#786F68",
          "base-100": "#262626",
          "success": "#1DD781",
          "warning": "#78350f",
          ".border-color": {
            "border-color": "#FCF8F4"
          }
        }
      }
    ], // true: all themes | false: only light + dark | array: specific themes like this ["light", "dark", "cupcake"]
    darkTheme: "dark", // name of one of the included themes for dark mode
    base: true, // applies background color and foreground color for root element by default
    styled: true, // include daisyUI colors and design decisions for all components
    utils: true, // adds responsive and modifier utility classes
    rtl: false, // rotate style direction from left-to-right to right-to-left. You also need to add dir="rtl" to your html tag and install `tailwindcss-flip` plugin for Tailwind CSS.
    prefix: "", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
    logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
  },
}

