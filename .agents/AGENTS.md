# CheckMate Project Rules and Best Practices

## Next.js Best Practices
- **Images**: Always use the Next.js `<Image>` component (`next/image`) instead of native `<img>` tags. Use the `fill` property with a relative parent container for responsive, optimized images or provide explicit `width` and `height`.
- **Links**: Use the Next.js `<Link>` component for internal navigation.
- **Server vs Client Components**: Default to Server Components, and add the `"use client"` directive only when hooks (`useState`, `useRef`, etc.) or browser APIs are required (like GSAP animations).

## Brand & Design Consistency
- **Colors**: Maintain strict adherence to the brand's tailored palette (defined in `tailwind.config.ts`). Never use generic Tailwind colors like `red-500` or `blue-500`. Only use tokens like `primary` (gold), `surface` (dark grey), and `border` (navy-grey).
- **Typography**: Only use the approved Google fonts: `Space Grotesk` (for headlines), `Plus Jakarta Sans` (for body text), and `JetBrains Mono` (for stats and code).
- **Borders & UI Elements**: No 1px solid borders. Favor tonal shifts, inner shadows, and the `.luxury-glow` custom class for depth and a premium look.
- **Animations**: Prefer `gsap` with `ScrollTrigger` for fluid, scrubbed micro-animations. Ensure `react-lenis` Smooth Scroll wraps the application layout.

## Documentation
- Continuously update this `.agents/AGENTS.md` file whenever new architectural or design decisions are made to ensure future contexts align with the project's standards.
