# CheckMate Web App

The frontend client for CheckMate. This is a Next.js 14 application styled with Tailwind CSS, bringing the high-end dark luxury aesthetic of CheckMate to the browser.

## Prerequisites
- Node.js (v18+)
- pnpm

## Setup Instructions

1. **Install Dependencies**
   From the root of the monorepo, or inside this directory:
   ```bash
   pnpm install
   ```

2. **Environment Variables**
   Create a `.env` file in this directory based on your `.env.example` (if one exists), or ensure the following variables are present:
   - `NEXT_PUBLIC_API_URL`: URL of the CheckMate API (e.g., `http://localhost:4000/api`).
   - Firebase Client Credentials (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`, etc.)

3. **Running the Development Server**
   ```bash
   pnpm dev
   ```
   The web app will start on `http://localhost:3000` by default.

4. **Building for Production**
   ```bash
   pnpm build
   pnpm start
   ```

## Architecture Highlights
- **Framework:** Next.js 14 using the App Router (`app/` directory).
- **Styling:** Tailwind CSS with a strict, brand-approved color palette (`primary`, `surface`, `border`, etc.) defined in `tailwind.config.ts`.
- **Animations:** High-performance DOM animations powered by GSAP (`@gsap/react` and `ScrollTrigger`), enhanced with Lenis for smooth scrolling.
- **State & Data Fetching:** `zustand` for global state management and `@tanstack/react-query` for reliable, caching-enabled data fetching (such as the live polling waitlist counter).
- **Forms:** Client-side forms are managed with `react-hook-form` and strictly validated using Zod schemas (`@checkmate/shared-types`) before hitting the backend.

## Design Rules
Refer to the `.agents/AGENTS.md` file in the root directory for strict engineering standards, typography, and color rules to follow when contributing to the UI.
