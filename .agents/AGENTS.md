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

## Base UI Components — ALWAYS USE THESE
- **`<Button>`** (`components/ui/Button.tsx`): Variants: `primary` (gold bg), `secondary` (gold outline), `ghost`. Sizes: `sm`, `md`, `lg`. Supports `isLoading`, `fullWidth`. Never write raw `<button>` with ad-hoc styles.
- **`<Card>`** (`components/ui/Card.tsx`): Variants: `default` (solid surface), `hud` (glassmorphism with gold top border, backdrop blur, hover glow). Padding: `none`, `sm`, `md`, `lg`. Use `hud` for all dashboard widgets.
- **`<Input>`** (`components/ui/Input.tsx`): Supports `label`, `error`, `icon`. Always use for form inputs.
- **`<Modal>`** (`components/ui/Modal.tsx`): Backdrop blur, escape to close, body scroll lock. Always use for overlays.
- **`<Skeleton>`** (`components/ui/Skeleton.tsx`): Use for loading states, never show empty containers.
- **`<Badge>`** (`components/ui/Badge.tsx`): For status indicators and labels.

## Sidebar & Navigation
- **AppSidebar**: Active tab uses gold glow (`shadow-[inset_4px_0_20px_rgba(201,168,76,0.15)]`), gold text, and icon drop-shadow. Hover state also transitions to gold (`hover:text-gold hover:bg-gold/5`).
- **AppNavbar**: Right side shows Crown balance in a dark pill (`♛ 1,234`), followed by AvatarDropdown. Crown count updates live via socket.

## Copywriting & Terminology
- **No Gambling Terminology**: CheckMate is a platform for elite professional chess, NOT a gambling or betting platform. Never use words like "bet", "gambling", "wager", "high stakes", or "odds" anywhere in the UI or marketing copy. Always frame features around "skill", "competition", "professional", and "elite level".
- **Currency is "Crowns"**: The in-app currency is called Crowns (symbol: ♛). 100 Crowns = $1.00 USD. Sidebar nav says "Wallet" but inside pages everything is branded as Crowns.

## Wallet / Crowns Architecture
- **Balance unit**: `wallet.availableBalance` is stored in **Crowns (integer)**, NOT USD cents. To display USD: `crowns / 100`.
- **Store pattern**: `wallet.store.ts` manages Crown balance. Methods: `creditCrowns()`, `debitCrowns()`. The `useWallet()` hook wraps the store with TanStack Query polling.
- **Socket events**: `wallet:crowns_update` emitted by backend when balance changes. Frontend subscribes in `WalletWidget` and wallet page.
- **Flutterwave**: Hosted checkout (redirect flow). Webhook at `POST /webhooks/flutterwave` with HMAC verification. Raw body parsed before `express.json()`.
- **Fee structure**: Users pay 2% fee on deposits. Withdrawal has no fee from our side.
- **Exchange rates**: Hardcoded `FALLBACK_RATES` for display. Flutterwave handles actual conversion. `exchangeRate.ts` utility mirrors backend/frontend.

## Documentation
- Continuously update this `.agents/AGENTS.md` file whenever new architectural or design decisions are made to ensure future contexts align with the project's standards.

## State & Feedback
- **Toasts as Source of Truth**: The custom toast component (`apps/web/components/utils/Toaster.tsx`) is the single source of truth and the default mechanism for displaying any success, error, or informational messages to the user across the application. Use it for all feedback variants.

