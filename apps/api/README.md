# CheckMate API

The backend service for CheckMate, handling the beta waitlist, user authentication, and game matchmaking securely. Built with Express, TypeScript, and Firebase Admin.

## Prerequisites
- Node.js (v18+)
- pnpm
- A Firebase project with Firestore enabled
- Resend API key (for emails)

## Setup Instructions

1. **Install Dependencies**
   From the root of the monorepo, or inside this directory:
   ```bash
   pnpm install
   ```

2. **Environment Variables**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Fill in the required variables in `.env`:
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID (e.g., `checkmate-29c7c`).
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: The private key JSON from Firebase Console > Project Settings > Service Accounts. **Must be minified into a single line string**.
   - `EMAIL_PROVIDER`: Set to `resend` (or `zeptomail` for production).
   - `RESEND_API_KEY`: Your Resend API key for sending confirmation emails.

3. **Running the Development Server**
   ```bash
   pnpm dev
   ```
   The API will start on `http://localhost:4000` by default.

4. **Building for Production**
   ```bash
   pnpm build
   ```
   This will compile the TypeScript code and copy the HTML email templates into the `dist/` directory.

## Architecture Highlights
- **Rate Limiting:** Enforced on sensitive routes (like `/join`) to prevent spam.
- **Firebase Transactions:** Waitlist positions are calculated using strict Firestore transactions to ensure atomic, race-condition-free queue numbering.
- **Email Abstraction:** Emails are sent via an abstract provider factory (`src/services/email/email.service.ts`). You can seamlessly switch between Resend and ZeptoMail by changing the `EMAIL_PROVIDER` environment variable.
- **Shared Types:** Uses `@checkmate/shared-types` (Zod schemas) to validate incoming request payloads.
