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
| **Landing page** | `/` | Marketing/intro page — feature highlights, links to Login/Register. |
| **Login / Register** | `/login`, `/register` | Email/password + Google sign-in auth flows (route group `(auth)`). |
| **Today** | `/practice` | Home surface. A "Today's Mission" checklist (vocab due, daily phrase, mistakes due, scenario practice) with progress x/4, the full Daily Phrase experience inline, plus suggestions for the message generator and listening practice — all mixed for the user's level. Includes a level-up suggestion banner. `/daily-phrase` redirects here (merged, no separate page); the "Review mistakes" action and `/mistakes` both lead to the Corrections tab in AI Coach (also merged). |
| **Goals** | `/goals` | Plan goals, track deadlines, manage tasks, calendar view. A goal's Overview tab shows a "Learning Practice" card (`components/goals/LearningPracticeCard.tsx`) — any task whose text names a learning feature (vocab, scenario, listening, etc., via `lib/learning-task-link.ts`) gets a direct "Practice →" deep link. Education-type goals also get quick-fill note presets in the AI Goal Coach to nudge generated tasks toward that vocabulary. Goals/tasks are otherwise a generic productivity feature with no other backend link to real learning activity. |
| **Dashboard** | `/dashboard` | Daily goal ring, streak, progress chart. A "Needs Attention" panel (`components/dashboard/ProgressIntelligence.tsx`) ranks real due-counts (vocab due, mistakes due, overdue goals, unlearned daily phrase) into a prioritized list with direct links — replaces the old static "Next Steps" list. There's no backend per-skill accuracy breakdown to rank against, so this sticks to real due-counts rather than a fabricated weakness score. |
| **Achievements** | `/achievements` | XP, levels, and skill badges. A compact level/XP badge (`components/achievements/LevelBadge.tsx`) also surfaces in both the desktop and mobile top bars on every page. |
| **AI Coach** | `/chat` | Unified AI workspace with four tabs: **Chat** (free conversation with Dev Mode + Korean voice mode), **Analyze** (decode a real Korean message — tone, politeness, replies), **Generate** (turn an English intent into Korean across formality levels), **Corrections** (SRS review of past mistakes, graded Again/Hard/Good/Easy — mistakes come from chat, so the review lives here too). |
| **Foundations** | `/learn` | Absolute-beginner Korean — Survival / Alphabet / Grammar tracks, per-lesson runner (`/learn/[lessonId]`). |
| **Vocabulary** | `/vocab` | Spaced-repetition decks, AI deck generation, list/textbook import, dictionary lookup, review sessions. |
| **Exam Prep** | `/interview` | Mock interview Q&A with an AI examiner, speech input, and feedback. |
| **Listening** | `/listening` | AI-generated listening passages — slow/normal speed playback, transcript, quiz. |
| **Scenarios** | `/scenarios` | Roleplay prompts for real-life and workplace situations; launches a guided AI conversation in Chat. |
| **Reading** | `/reading` | Multi-unit reading with tap-to-translate, audio, and quizzes. |
| **History** | `/history` | "Progress Lab" — past study sessions/attempts across features. Reachable from Settings, not in the main nav. |
| **Dev Notes** | `/notes` | Personal knowledge library (Java/Spring/SQL/etc. study notes) with search, markdown editor (`/notes/new`), and per-note view (`/notes/[slug]`). Reachable from Settings ("Developer Notes"), not in the main nav. |
| **Settings** | `/settings` | Profile, Korean level, work context, model preference, avatar. Links to History and Developer Notes. |

### Navigation

- **Desktop:** a grouped sidebar (`Plan` / `Learn` / `Account`) in `app/(main)/layout.tsx`. `Plan` is the primary loop — Today → Goals → Dashboard → Achievements; `Learn` leads with AI Coach, then Foundations → Vocabulary → Exam Prep → Listening → Scenarios → Reading; `Account` has Settings only (History and Dev Notes are reachable from inside Settings, not the sidebar).
- **Header:** a compact level/XP badge (`LevelBadge`) sits in both the desktop and mobile top bars on every page, linking to `/achievements`.
- **Mobile:** a six-slot bottom bar — Home · Vocab · Goals · Exam · AI · **More**. "More" opens a bottom sheet listing every remaining sidebar link (Today, Foundations, Listening, Scenarios, Reading, Achievements, Settings) so nothing is unreachable on a phone.
- **Immersive chat:** on `/chat` the mobile header, bottom tabs, and content padding are removed for a full-screen experience.

## Architecture

- **API layer — `lib/api/` is the single integration point.** A per-domain service package: `client.ts` holds the one axios instance + interceptors, each domain has its own file (`auth`, `chat`, `vocab`, `goals`, `interview`, `reading`, `progress`, `learning`, `tts`, `push`, `user`), and `index.ts` re-exports everything so callers still `import { … } from "@/lib/api"`. The backend wraps every payload in an envelope, so responses are unwrapped with `r.data.data`. Add new backend calls to the matching domain file, not inline in components.
- A request interceptor attaches `Authorization: Bearer <token>` from localStorage; a 401 response clears auth and redirects to `/login`.
- `chatApi.streamMessage` is the exception to axios — it uses raw `fetch` to parse SSE events (`start` / `token` / `done` / `error`) from `POST /chat/stream`.
- **Auth** is JWT stored in localStorage via `lib/auth-store.ts`. The route guard is client-side only (`app/(main)/layout.tsx` redirects when not authenticated). `lib/auth.ts` (NextAuth) is an unwired stub.

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_web_oauth_client_id
```

- `NEXT_PUBLIC_API_BASE_URL` is read by `lib/api/client.ts` (default `http://localhost:8080/api`).
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` powers the "Sign in with Google" button (`components/google-sign-in-button.tsx`). Create a **Web application** OAuth client in Google Cloud Console, add `http://localhost:3000` to its authorized origins, and set the same client ID on the backend. Restart the dev server after changing it (`NEXT_PUBLIC_*` vars are read at startup).

## Project Structure

```text
app/
  (auth)/         login, register
  (main)/         app shell + every feature page
    layout.tsx    sidebar, mobile tabs, immersive-chat handling
    chat/         AI Coach (Chat / Analyze / Generate tabs)
    goals/  dashboard/  vocab/  reading/  daily-phrase/  interview/  settings/
    practice/     Today — Daily Practice Hub
    learn/        Foundations (Survival / Alphabet / Grammar lessons)
    scenarios/    Roleplay Scenarios
    notes/        Dev Notes (knowledge library), notes/new, notes/[slug]
    mistakes/     SRS review of past corrections
components/
  ui/             reusable shadcn-style primitives (keep generic)
  chat/  ai/  vocab/  goals/  calendar/  reading/  dashboard/  learn/  notes/  ...
hooks/            useChat, useVocab, useFoundations, useNotes, etc. (some manage state directly)
lib/
  api/            backend integration — per-domain service package (client + barrel)
  auth-store.ts   JWT in localStorage
  goals.ts  reading.ts  vocab-review.ts  srs.ts  ...
```

## Deployment

- Frontend → Vercel. Backend (Spring Boot) deploys separately.
- Set environment variables on the platform, then `pnpm build` / `pnpm start`.

---

Built by **Hen Heang** — 2026.
