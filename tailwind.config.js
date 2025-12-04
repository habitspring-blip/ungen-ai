/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // Neutral surfaces
        surface: {
          0: "rgb(var(--surface-0))",
          1: "rgb(var(--surface-1))",
          2: "rgb(var(--surface-2))",
          3: "rgb(var(--surface-3))",
        },

        // Neutral inks
        ink: {
          0: "rgb(var(--ink-0))",
          1: "rgb(var(--ink-1))",
          2: "rgb(var(--ink-2))",
        },

        // Neutral accent
        accent: "rgb(var(--accent))",

        // Vibrant brand gradients (Pricing-style)
        brand: {
          indigo: {
            start: "rgb(var(--brand-indigo-start))",
            end: "rgb(var(--brand-indigo-end))",
          },
          pink: {
            start: "rgb(var(--brand-pink-start))",
            end: "rgb(var(--brand-pink-end))",
          },
          emerald: {
            start: "rgb(var(--brand-emerald-start))",
            end: "rgb(var(--brand-emerald-end))",
          },
          amber: {
            start: "rgb(var(--brand-amber-start))",
            end: "rgb(var(--brand-amber-end))",
          },
        },
      },

      /* Shadows */
      boxShadow: {
        soft: "var(--shadow-1)",
        depth: "var(--shadow-2)",
      },

      /* Radii */
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },

      /* Background gradients (responsive to brand tokens) */
      backgroundImage: {
        "gradient-brand-indigo":
          "linear-gradient(to bottom right, rgb(var(--brand-indigo-start)), rgb(var(--brand-indigo-end)))",
        "gradient-brand-pink":
          "linear-gradient(to bottom right, rgb(var(--brand-pink-start)), rgb(var(--brand-pink-end)))",
        "gradient-brand-emerald":
          "linear-gradient(to bottom right, rgb(var(--brand-emerald-start)), rgb(var(--brand-emerald-end)))",
        "gradient-brand-amber":
          "linear-gradient(to bottom right, rgb(var(--brand-amber-start)), rgb(var(--brand-amber-end)))",
      },
    },
  },

  plugins: [],
};
