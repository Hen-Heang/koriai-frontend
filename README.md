# Hengo Frontend

Frontend for **Hengo** (by Hen Heang), an AI companion for daily growth — set goals, track to-dos, and learn (including workplace/technical Korean for developers).

This is effectively a **client-side SPA** that talks to a separate Spring Boot backend. There are no Next.js API routes or server actions; nearly every page is a client component, and all data comes from the backend at `NEXT_PUBLIC_API_BASE_URL`.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 (CSS-based config, no `tailwind.config`) · shadcn/ui + Radix primitives
- TanStack Query (provided globally; several hooks also manage state manually)
- `motion/react` for animation · `lucide-react` icons · `sonner` toasts · `recharts` charts
- React Hook Form + Zod · axios · date-fns
- Dark mode via `next-themes`

## Commands

Use **pnpm** (ignore the stray `package-lock.json`).

```bash
pnpm dev          # dev server at localhost:3000
pnpm build        # production build
pnpm lint         # eslint
npx vitest run    # run all unit tests (no "test" script in package.json)
npx vitest run lib/vocab-review.test.ts   # run a single test file
```

Tests are plain vitest unit tests colocated in `lib/*.test.ts` (no vitest config file — defaults apply).

## Features

| Area | Route | What it does |
|---|---|---|
| **Goals** | `/goals` | Primary surface. Plan goals, track deadlines, manage tasks, calendar view. |
| **Dashboard** | `/dashboard` | Daily goal ring, streak, progress chart, next steps. |
| **Vocabulary** | `/vocab` | Spaced-repetition decks, AI deck generation, list import, review sessions. |
| **Reading** | `/reading` | Multi-unit reading with tap-to-translate, audio, and quizzes. |
| **Daily Phrase** | `/daily-phrase` | One curated workplace phrase per day with a sentence challenge. |
| **Exam Prep** | `/interview` | Mock interview Q&A with an AI examiner, speech input, and feedback. |
| **AI Coach** | `/chat` | Unified AI workspace with three tabs: **Chat** (free conversation with Dev Mode + Korean voice mode), **Analyze** (decode a real Korean message — tone, politeness, replies), **Generate** (turn an English intent into Korean across formality levels). |
| **Settings** | `/settings` | Profile, Korean level, work context, model preference, avatar. Links to practice History. |

Built but currently hidden from navigation (wired to the backend, easy to restore by uncommenting in `app/(main)/layout.tsx`): **Listening** (`/listening`) and **Achievements** (`/achievements`). **History** (`/history`) is reachable from the Settings page.

### Navigation

- **Desktop:** a grouped sidebar (`Plan` / `Learn` / `Account`) in `app/(main)/layout.tsx`.
- **Mobile:** a bottom tab bar — Home · Vocab · **Goals** (elevated center) · AI · Exam. The AI Coach is one tap away; Reading lives in the desktop sidebar.
- **Immersive chat:** on `/chat` the mobile header, bottom tabs, and content padding are removed for a full-screen experience.

## Architecture

- **API layer — `lib/api.ts` is the single integration point.** One axios instance plus per-domain endpoint groups (`authApi`, `chatApi`, `vocabApi`, `listeningApi`, `analyzerApi`, `messageGenApi`, …). The backend wraps every payload in an envelope, so responses are unwrapped with `r.data.data`. Add new backend calls here, not inline in components.
- A request interceptor attaches `Authorization: Bearer <token>` from localStorage; a 401 response clears auth and redirects to `/login`.
- `chatApi.streamMessage` is the exception to axios — it uses raw `fetch` to parse SSE events (`start` / `token` / `done` / `error`) from `POST /chat/stream`.
- **Auth** is JWT stored in localStorage via `lib/auth-store.ts`. The route guard is client-side only (`app/(main)/layout.tsx` redirects when not authenticated). `lib/auth.ts` (NextAuth) is an unwired stub.

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_web_oauth_client_id
```

- `NEXT_PUBLIC_API_BASE_URL` is read by `lib/api.ts` (default `http://localhost:8080/api`).
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` powers the "Sign in with Google" button (`components/google-sign-in-button.tsx`). Create a **Web application** OAuth client in Google Cloud Console, add `http://localhost:3000` to its authorized origins, and set the same client ID on the backend. Restart the dev server after changing it (`NEXT_PUBLIC_*` vars are read at startup).

## Project Structure

```text
app/
  (auth)/         login, register
  (main)/         app shell + every feature page
    layout.tsx    sidebar, mobile tabs, immersive-chat handling
    chat/         AI Coach (Chat / Analyze / Generate tabs)
    goals/  dashboard/  vocab/  reading/  daily-phrase/  interview/  settings/
components/
  ui/             reusable shadcn-style primitives (keep generic)
  chat/  ai/  vocab/  goals/  calendar/  reading/  dashboard/  ...
hooks/            useChat, useVocab, etc. (some manage state directly)
lib/
  api.ts          single backend integration point
  auth-store.ts   JWT in localStorage
  goals.ts  reading.ts  vocab-review.ts  srs.ts  ...
```

## Deployment

- Frontend → Vercel. Backend (Spring Boot) deploys separately.
- Set environment variables on the platform, then `pnpm build` / `pnpm start`.

---

Built by **Hen Heang** — 2026.
