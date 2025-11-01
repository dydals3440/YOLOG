/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	future: {
		hoverOnlyWhenSupported: true,
	},
	theme: {
		fontFamily: {
			sans: ["var(--font-sans)", "sans"],
			serif: ["var(--font-serif)", "sans-serif"],
			mono: ["var(--font-mono)", "monospace"],
		},
		screens: {
			xl: { max: "1200px" },
			lg: { max: "1024px" },
			md: { max: "768px" },
			sm: { max: "640px" },
		},
		colors: {
			gray: {
				50: "var(--gray-50)",
				75: "var(--gray-75)",
				100: "var(--gray-100)",
				200: "var(--gray-200)",
				300: "var(--gray-300)",
				400: "var(--gray-400)",
				500: "var(--gray-500)",
				600: "var(--gray-600)",
				700: "var(--gray-700)",
				800: "var(--gray-800)",
				900: "var(--gray-900)",
				950: "var(--gray-950)",
			},
			transparent: "transparent",
			selection: "var(--selection)",
			border: "var(--border)",
			drag: "var(--drag)",
		},
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			textColor: {
				heading: "var(--heading)",
				body: "var(--text-body)",
				second: "var(--text-second)",
				disabled: "var(--text-disabled)",
			},
			backgroundColor: {
				page: "var(--page-background)",
				opacity: "var(--page-opacity)",
			},
			maxWidth: {
				page: "var(--page-width)",
				content: "var(--content-width)",
			},
			width: {
				page: "var(--page-width)",
				content: "var(--content-width)",
			},
			spacing: {
				page: "var(--page-top)",
				"half-page": "var(--page-half-top)",
			},
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
		},
	},
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	plugins: [require("tailwindcss-animate")],
};
