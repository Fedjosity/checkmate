import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  "extend": {
    "colors": {
      "on-tertiary": "#1e2b66",
      "on-primary-container": "#503d00",
      "on-background": "#e3e2e8",
      "surface": "#0D1017",
      "surface-container": "#1f1f24",
      "inverse-on-surface": "#2f3035",
      "outline-variant": "#4d4637",
      "tertiary-fixed-dim": "#b9c3ff",
      "on-tertiary-fixed-variant": "#35437e",
      "on-primary-fixed-variant": "#584400",
      "on-secondary": "#3f2e00",
      "surface-tint": "#e6c364",
      "on-tertiary-fixed": "#041451",
      "tertiary-fixed": "#dde1ff",
      "surface-dim": "#121317",
      "on-primary": "#3d2e00",
      "on-secondary-container": "#cfb175",
      "primary-fixed-dim": "#e6c364",
      "primary-fixed": "#ffe08f",
      "secondary-fixed-dim": "#e2c384",
      "on-secondary-fixed-variant": "#594411",
      "primary-container": "#c9a84c",
      "on-error": "#690005",
      "surface-bright": "#38393e",
      "on-primary-fixed": "#241a00",
      "inverse-surface": "#e3e2e8",
      "on-secondary-fixed": "#261a00",
      "surface-container-high": "#292a2e",
      "on-surface-variant": "#d0c5b2",
      "outline": "#99907e",
      "surface-variant": "#343439",
      "surface-container-low": "#1a1b20",
      "error": "#ffb4ab",
      "on-surface": "#e3e2e8",
      "secondary-container": "#594411",
      "on-error-container": "#ffdad6",
      "tertiary-container": "#9ba8eb",
      "text-muted": "#6B7280",
      "primary": "#e6c364",
      "error-container": "#93000a",
      "inverse-primary": "#755b00",
      "surface-container-lowest": "#0d0e12",
      "background": "#121317",
      "on-tertiary-container": "#2e3b77",
      "secondary": "#e2c384",
      "surface-container-highest": "#343439",
      "border": "#1A1F2E",
      "tertiary": "#b9c4ff",
      "success": "#81B64C",
      "text-primary": "#F0F0EE",
      "secondary-fixed": "#ffdf9e",
      "gold": "#C9A84C",
      "gold-dim": "#7D6530"
    },
    "borderRadius": {
      "DEFAULT": "0.25rem",
      "lg": "0.5rem",
      "xl": "0.75rem",
      "full": "9999px"
    },
    "spacing": {
      "margin-mobile": "16px",
      "gutter": "24px",
      "margin-desktop": "64px",
      "unit": "4px",
      "section-gap": "120px"
    },
    "fontFamily": {
      "headline-lg-mobile": [
        "var(--font-space-grotesk)", "sans-serif"
      ],
      "body-lg": [
        "var(--font-plus-jakarta)", "sans-serif"
      ],
      "headline-xl": [
        "var(--font-space-grotesk)", "sans-serif"
      ],
      "headline-md": [
        "var(--font-space-grotesk)", "sans-serif"
      ],
      "headline-lg": [
        "var(--font-space-grotesk)", "sans-serif"
      ],
      "stats-mono": [
        "var(--font-jetbrains)", "monospace"
      ],
      "body-md": [
        "var(--font-plus-jakarta)", "sans-serif"
      ],
      "label-caps": [
        "var(--font-space-grotesk)", "sans-serif"
      ]
    },
    "fontSize": {
      "headline-lg-mobile": [
        "32px",
        {
          "lineHeight": "1.2",
          "letterSpacing": "-0.02em",
          "fontWeight": "700"
        }
      ],
      "body-lg": [
        "18px",
        {
          "lineHeight": "1.6",
          "fontWeight": "400"
        }
      ],
      "headline-xl": [
        "64px",
        {
          "lineHeight": "1.1",
          "letterSpacing": "-0.04em",
          "fontWeight": "800"
        }
      ],
      "headline-md": [
        "24px",
        {
          "lineHeight": "1.3",
          "fontWeight": "700"
        }
      ],
      "headline-lg": [
        "40px",
        {
          "lineHeight": "1.2",
          "letterSpacing": "-0.02em",
          "fontWeight": "800"
        }
      ],
      "stats-mono": [
        "14px",
        {
          "lineHeight": "1.0",
          "letterSpacing": "0.05em",
          "fontWeight": "500"
        }
      ],
      "body-md": [
        "16px",
        {
          "lineHeight": "1.6",
          "fontWeight": "400"
        }
      ],
      "label-caps": [
        "12px",
        {
          "lineHeight": "1.0",
          "letterSpacing": "0.1em",
          "fontWeight": "700"
        }
      ]
    }
  }
},
  plugins: [],
};
export default config;
