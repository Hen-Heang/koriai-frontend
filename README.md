# KoriAI Frontend

Frontend for a Korean AI learning platform built with Next.js App Router.

This repo currently focuses on the frontend side:
- landing page
- auth screens
- dashboard (Personalized for Developers)
- AI chat (with specialized Dev Mode)
- correction flow
- diary feedback
- vocabulary review (Technical & Workplace categories)
- scenario practice
- settings

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- Radix UI
- Lucide React
- TanStack Query
- React Hook Form + Zod
- Next Themes
- Recharts
- Sonner
- Framer Motion (motion/react)

## Recent Enhancements (Workplace & Technical Focus)

The platform has been optimized for **software developers** who need to master Korean for professional environments.

### 1. Developer-First Features
- **Dev Mode (AI Chat):** A specialized toggle that adjusts the AI tutor's persona to use IT terminology, office honorifics, and technical context (e.g., Stand-ups, PR Reviews).
- **Technical Vocabulary:** New categories for "IT & Software" and "Workplace" added to the AI deck builder.
- **Pro Dashboard:** Quick Start actions prioritized for professional development.

### 2. Modern AI UX (Gemini-Inspired)
- **Conversation Stream:** Moved away from "SMS bubbles" to a full-width, clean layout similar to ChatGPT and Gemini for better technical readability.
- **Pill-Shaped Input:** A sleek, minimal input area with integrated utility icons (+, Mic) and action buttons.
- **Compact Chips:** Minimalist suggestion pills for quick interaction without visual clutter.

### 3. iPhone 12 Pro Max Optimization
- **Immersive Full-Screen Chat:** Mobile navigation and headers automatically hide during active chat sessions to maximize screen real estate.
- **Safe-Area Awareness:** UI elements are anchored correctly to respect the notch and home indicator.
- **Back Navigation:** Dedicated mobile back button added to the immersive chat header.

## Run Locally

Install dependencies:

```bash
pnpm install
```

Start development server:

```bash
pnpm dev
```

Build production output:

```bash
pnpm build
```

Run lint:

```bash
pnpm lint
```

## Environment Variables

Create a local env file when you start wiring real services:

```bash
.env.local
```

Suggested variables:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me
OPENAI_API_KEY=your_openai_key
```

Notes:
- `NEXT_PUBLIC_API_BASE_URL` is already used by [lib/api.ts](lib/api.ts).
- `NEXTAUTH_URL` and `NEXTAUTH_SECRET` will matter once auth is connected end-to-end.
- `OPENAI_API_KEY` should only be used through a backend or secure server route, not directly from the browser.

## Project Structure

```text
app/
  layout.tsx
  page.tsx
  (auth)/
    login/page.tsx
    register/page.tsx
  (main)/
    layout.tsx
    dashboard/page.tsx
    chat/page.tsx
    chat/[id]/page.tsx
    correct/page.tsx
    diary/page.tsx
    vocab/page.tsx
    scenarios/page.tsx
    scenarios/[id]/page.tsx
    settings/page.tsx

components/
  providers/
  chat/
    ChatWindow.tsx      <- Optimized Immersive Layout
    MessageBubble.tsx   <- Stream-style conversation
  dashboard/
  diary/
  vocab/
  ui/

hooks/
  useChat.ts            <- Includes technical mode logic
  useProgress.ts
  useVocab.ts

lib/
  api.ts
  auth.ts
  types.ts
  utils.ts
```

## Current Frontend Notes

- The app uses route groups for `/(auth)` and `/(main)`.
- `components/ui/*` contains reusable primitives and should be kept reusable.
- `lib/api.ts` is prepared for backend integration through Axios.
- `lib/auth.ts` contains a frontend auth config stub.
- `hooks/*` currently use mock/demo data where backend APIs are not connected yet.
- Dark mode is enabled with `next-themes`.
- Mobile layout has been adjusted for iPhone-sized screens with an immersive, distraction-free chat pattern.

## Feature Checklist

- [x] Landing page
- [x] Login page
- [x] Register page
- [x] Main app shell
- [x] Dashboard UI (Pro optimized)
- [x] Chat UI (Gemini style)
- [x] Dev Mode toggle & logic
- [x] Conversation detail page
- [x] Correction page UI
- [x] Diary page UI
- [x] Vocabulary page UI (IT/Workplace categories)
- [x] Scenarios list UI
- [x] Scenario detail UI
- [x] Settings page UI
- [x] Dark mode toggle
- [x] Mobile immersive navigation
- [x] Responsive layout (iPhone 12 Pro Max tuned)
- [ ] Real backend API integration
- [ ] Real auth flow
- [ ] Persistent chat history
- [ ] Real vocabulary review logic
- [ ] Real diary analysis pipeline
- [ ] Scenario prompt/backend integration
- [ ] Automated tests for major flows

## Integration Status

| Area | Status | Notes |
|---|---|---|
| UI primitives | Ready | Built with `components/ui/*` |
| Routing | Ready | App Router structure is in place |
| Theme | Ready | `next-themes` + dark mode toggle |
| API client | Partial | Axios instance exists in `lib/api.ts` |
| Authentication | Partial | Config stub exists in `lib/auth.ts` |
| Chat data | Mock | `hooks/useChat.ts` currently simulates responses |
| Progress data | Mock | `hooks/useProgress.ts` uses static demo data |
| Vocab data | Mock | `hooks/useVocab.ts` uses local state/demo words |
| OpenAI integration | Not connected | `openai` package is installed but not wired |
| Backend integration | Not connected | No live Spring Boot connection yet |
| Testing | Partial | Tooling installed, tests not written yet |

## Devices Targeted

The UI has been tuned primarily for:
- iPhone 12 Pro Max (428x926px)
- MacBook Pro / Apple Silicon laptops

That includes:
- safer mobile spacing
- immersive chat (hides navigation)
- dark mode support
- glassy, Apple-inspired visual treatment

## Deployment

Recommended deployment targets:
- Vercel for the frontend
- separate backend deployment for Spring Boot / API services

Basic frontend deployment flow:

1. Push the repo with source files only.
2. Configure environment variables in your deployment platform.
3. Run the production build:

```bash
pnpm build
pnpm start
```

## Screens / UX Notes

Current design direction:
- dark mode and light mode supported
- Apple-inspired glassy surfaces
- tuned for iPhone 12 Pro Max and MacBook-class screens
- sidebar on desktop, full-screen immersive view on mobile chat

## Next Steps

Recommended next work:
- connect real backend APIs to `lib/api.ts`
- replace mock hook data with live queries
- add tests for major flows
- finish responsive polish for all feature pages
---

Built with ❤️ by **Hen Heang** — 2026.
