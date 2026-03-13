# KoriAI Frontend

Frontend for a Korean AI learning platform built with Next.js App Router.

This repo currently focuses on the frontend side:
- landing page
- auth screens
- dashboard
- AI chat
- correction flow
- diary feedback
- vocabulary review
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
- `NEXT_PUBLIC_API_BASE_URL` is already used by [lib/api.ts](C:/Practice/koriai-frontend/lib/api.ts).
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
  dashboard/
  diary/
  vocab/
  ui/

hooks/
  useChat.ts
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
- Mobile layout has been adjusted for iPhone-sized screens with a sheet-based navigation pattern.

## Feature Checklist

- [x] Landing page
- [x] Login page
- [x] Register page
- [x] Main app shell
- [x] Dashboard UI
- [x] Chat UI
- [x] Conversation detail page
- [x] Correction page UI
- [x] Diary page UI
- [x] Vocabulary page UI
- [x] Scenarios list UI
- [x] Scenario detail UI
- [x] Settings page UI
- [x] Dark mode toggle
- [x] Mobile navigation sheet
- [x] Responsive layout baseline
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
- iPhone 12 Pro Max
- MacBook Pro / Apple Silicon laptops

That includes:
- safer mobile spacing
- mobile navigation sheet
- dark mode support
- glassy, Apple-inspired visual treatment

## Git Notes

Do not commit generated build/cache folders such as:

```text
.next
.next-stale
```

Only commit source files, config, and lockfiles.

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

Production considerations:
- do not expose private API keys in client code
- point `NEXT_PUBLIC_API_BASE_URL` to your backend gateway
- configure `NEXTAUTH_URL` to your deployed frontend domain
- keep `.next` and `.next-stale` out of git

## Screens / UX Notes

Current design direction:
- dark mode and light mode supported
- Apple-inspired glassy surfaces
- tuned for iPhone 12 Pro Max and MacBook-class screens
- sidebar on desktop, sheet navigation on mobile

Suggested future README additions:
- screenshots or GIFs for each feature page
- API contract examples
- backend integration guide
- testing instructions when tests are added

## Next Steps

Recommended next work:
- connect real backend APIs to `lib/api.ts`
- replace mock hook data with live queries
- add tests for major flows
- finish responsive polish for all feature pages
- refine dark mode consistently across every screen
