# Hengo Frontend (KoriAI)

Frontend for **Hengo** (by Hen Heang), an AI companion for daily growth — set goals, track to-dos, and learn workplace/technical Korean for software developers working in Korea.

This is a **client-side SPA over Supabase, plus a thin set of Next.js AI routes**. The former Spring Boot backend was replaced (July 2026): data and auth now live in Supabase, and the AI features run in `app/api/ai/*` route handlers — the only server-side code in the app.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Supabase (`@supabase/supabase-js`) — data + auth, shared project with Orbit/DailyGoalMap
- Vercel AI SDK (`ai` + `@ai-sdk/openai`) — server-side AI routes, default model `gpt-5-mini`
- Tailwind CSS v4 (CSS-based config, no `tailwind.config`) · shadcn/ui + Radix primitives
- TanStack Query (provided globally; several hooks also manage state manually)
- `motion/react` for animation · `gsap` + `lenis` on the landing page · `lucide-react` icons · `sonner` toasts · `recharts` charts
- React Hook Form + Zod · date-fns · `es-hangul` (Korean text utilities) · `marked` (notes markdown)
- Dark mode via `next-themes` · error reporting via `@sentry/nextjs`

## Commands

Use **pnpm**.

```bash
pnpm dev          # dev server at localhost:3000
pnpm build        # production build
pnpm lint         # eslint
pnpm test         # run all unit tests (vitest)
pnpm test:watch   # vitest watch mode
npx vitest run lib/vocab-review.test.ts   # run a single test file
```

Tests are plain vitest unit tests colocated in `lib/*.test.ts` (srs, vocab-review, vocab-import, reading, interview, interview-history, study-focus, study-plan). No vitest config file — defaults apply.

> **Local dev behind corporate SSL inspection (Somansa):** Node.js doesn't trust the interception CA, so every server-side fetch (Supabase auth in `requireUser`, OpenAI) fails with `SELF_SIGNED_CERT_IN_CHAIN` and all `app/api/ai/*` routes return 401 even for valid logins. Run the dev server with `NODE_EXTRA_CA_CERTS` pointing at the exported root CA. Browser-side Supabase calls are unaffected, so the symptom is "everything works except AI".

## Features

| Area | Route | What it does |
|---|---|---|
| **Landing page** | `/` | Marketing/intro page — feature highlights, links to Login/Register. |
| **Login / Register** | `/login`, `/register` | Supabase auth — email/password + Google sign-in (route group `(auth)`). |
| **Today** | `/practice` | Home surface. "Today's Mission" checklist (vocab due, daily phrase, mistakes due, scenario practice), the full Daily Phrase experience inline, plus suggestions mixed for the user's level. `/daily-phrase` redirects here; `/mistakes` redirects to the Corrections tab in AI Coach (both merged, stubs kept for old bookmarks). |
| **Goals** | `/goals` | Plan goals, track deadlines, manage tasks, calendar view. Reuses Orbit's `goals`/`tasks` tables and RPCs. A goal's Overview tab shows a "Learning Practice" card — tasks that name a learning feature (via `lib/learning-task-link.ts`) get a "Practice →" deep link. AI Goal Coach streams task suggestions. |
| **Dashboard** | `/dashboard` | Daily goal ring, streak, progress chart, and a "Needs Attention" panel ranking real due-counts (vocab due, mistakes due, overdue goals, unlearned daily phrase) into a prioritized list with direct links. |
| **Achievements** | `/achievements` | XP, levels, and skill badges. A compact level/XP badge (`components/achievements/LevelBadge.tsx`) surfaces in the desktop and mobile top bars on every page. |
| **AI Coach** | `/chat` | Unified AI workspace with four tabs: **Chat** (free conversation with Dev Mode + Korean voice mode, streamed over SSE), **Analyze** (decode a real Korean message — tone, politeness, replies), **Generate** (turn an English intent into Korean across formality levels), **Corrections** (SRS review of past mistakes, graded Again/Hard/Good/Easy). |
| **Foundations** | `/learn` | Absolute-beginner Korean — Survival / Alphabet / Grammar tracks, per-lesson runner (`/learn/[lessonId]`). |
| **Vocabulary** | `/vocab` | Spaced-repetition decks, AI deck generation, list/textbook import, dictionary lookup, review sessions, sentence challenges. |
| **Exam Prep** | `/interview` | Mock interview Q&A with an AI examiner, speech input, and feedback. Includes a script writer (`/interview/script`) for preparing and practicing exam answers. |
| **Scenarios** | `/scenarios` | Roleplay prompts for real-life and workplace situations; launches a guided AI conversation in Chat. |
| **Reading** | `/reading` | Multi-unit reading with tap-to-translate, audio, and quizzes. |
| **Listening** | `/listening` | AI-generated listening passages — slow/normal playback, transcript, quiz. Currently **hidden from the nav** (link commented out in the shell) but the page still works. |
| **Roadmap** | `/roadmap` | Learning Roadmap — track study sections/milestones, with customizable sections persisted locally. |
| **History** | `/history` | "Progress Lab" — past study sessions/attempts across features. Reachable from the sidebar's Track group. |
| **Dev Notes** | `/notes` | Personal knowledge library (Java/Spring/SQL/etc. study notes) with search, markdown editor (`/notes/new`), and per-note view (`/notes/[slug]`). Reachable from Settings, not the main nav. |
| **Settings** | `/settings` | Profile, Korean level, work context, model preference, avatar. `/account` is an alias for the same page. |

### Navigation

- **Desktop:** a grouped sidebar in `app/(main)/layout.tsx` — `Practice` (Today · Goals · Dashboard), `Study` (Foundations · Vocabulary · Exam Prep · Scenarios · Reading; Listening commented out), `Track` (History · Achievements), plus AI Coach and Account/Settings entries. Hidden features keep their nav links commented out in place for easy restore — keep that convention.
- **Header:** a compact level/XP badge sits in both the desktop and mobile top bars, linking to `/achievements`.
- **Mobile:** a bottom tab bar — Home (Dashboard) · Today · Vocab · Goals · AI — with a "More" sheet exposing the remaining Study / Track / App links so nothing is unreachable on a phone.
- **Immersive chat:** on `/chat` routes the mobile header, bottom tabs, and content padding are removed for a full-bleed experience. If you touch chat layout, check both the shell's `isChatRoute` branches and `components/chat/ChatWindow.tsx`.

## Design system

The UI follows one calm, consistent visual language — keep new screens on the same system:

- **Radius:** one token — `rounded-2xl` for cards/inputs/surfaces, `rounded-xl` for buttons, `rounded-full` for chips. Avoid arbitrary radii.
- **Elevation:** subtle `border` + `shadow-sm`; avoid `shadow-xl`/`shadow-2xl` and decorative glows. A single dark hero is the page's focal point.
- **Icons:** `lucide-react` at `strokeWidth={2}`, ~16–20px in cards.
- **Typography:** bold is reserved for the page `h1` and key metrics; card titles use `font-semibold`, labels/body use `font-medium` or muted. Prefer sentence case over `uppercase tracking-wide` eyebrows.
- **Color:** a single blue accent on neutral surfaces; semantic colors (amber/rose/emerald) only for status. Hover states are calm (border/color change, no scale or lift).
- **Brand:** product name **Hengo**; logo at `public/hengo-icon.svg` (used for the AI Coach avatar and auth/landing marks).
- **Mobile:** tuned for iPhone 12 Pro Max — `env(safe-area-inset-*)` padding and `100dvh`-style units.

## Architecture

### Supabase — data + auth

- `lib/supabase.ts` holds the single browser client. The Supabase project is **shared with Orbit/DailyGoalMap**: KoriAI-owned tables are prefixed `kori_`; the goals/tasks domain reuses Orbit's original tables (`goals`, `tasks`, …) and RPCs. All tables have RLS; queries rely on it rather than filtering by user id everywhere.
- Auth is Supabase auth — email/password + Google via `signInWithIdToken` (`lib/google-auth.ts`). The session persists under the fixed storage key `koriai-auth` so `lib/auth-store.ts` can read the user id synchronously. The route guard is client-side only: `app/(main)/layout.tsx` redirects to `/login`.

### API layer — `lib/api/` (the single integration point)

- Per-domain service package: each domain file (`auth`, `chat`, `vocab`, `goals`, `interview`, `reading`, `progress`, `learning`, `foundations`, `tts`, `push`, `user`, `notes`) queries Supabase directly and maps snake_case rows to the app's camelCase types. `lib/api/index.ts` is a barrel — import from `@/lib/api`. Add a new backend call to the matching domain file, not inline in components.
- `lib/api/errors.ts` — `getApiErrorMessage` formats supabase-js / fetch errors; used by most hooks and pages.
- `lib/api/ai-client.ts` — `aiPost` / `authHeaders` attach the Supabase access token for calls to `app/api/ai/*`. `lib/api/sse.ts` parses the SSE streams.

### AI routes — `app/api/ai/*`

The only server-side code in the app. `lib/server/ai.ts` is the shared plumbing:

- `requireUser` verifies the caller's Supabase JWT and returns a per-request client so **RLS applies — no service key anywhere**.
- `jsonAiRoute` — zod schema + prompt → `generateObject` → JSON, used by most endpoints.
- Streaming routes (`chat/stream`, `goals/coach`) keep the SSE event protocol the Spring backend used: `start` / `token` / `done` / `error`. `chat/stream` also persists both message rows in `kori_messages`.
- Models via `@ai-sdk/openai` with server-side `OPENAI_API_KEY`; default `gpt-5-mini` (override with `AI_MODEL`). `tts` proxies OpenAI's audio API and returns MP3 bytes.

Endpoints: `analyzer`, `chat/stream`, `corrections/check`, `daily-phrase/{generate,practice,check-practice}`, `goals/{coach,generate-tasks}`, `listening/generate`, `message-generator`, `tts`, `vocab/{generate,lookup,check-sentence,sentence-challenge}`.

### Data state

- TanStack Query is provided globally (`components/providers/app-providers.tsx`, staleTime 60s, no refetch on focus), but several hooks (`useChat`, parts of others) manage state manually with `useState` + direct api calls.
- `useChat` injects response-language and "Dev Mode" (technical Korean) instructions into the outgoing message text rather than via API parameters.

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_web_oauth_client_id
NEXT_PUBLIC_VAPID_KEY=your_web_push_vapid_public_key
# optional
AI_MODEL=gpt-5-mini
TTS_MODEL=...
```

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the shared Orbit Supabase project (`lib/supabase.ts`).
- `OPENAI_API_KEY` — server-side, required for every `app/api/ai/*` route (set it in Vercel too when deploying).
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — powers "Sign in with Google" (`components/google-sign-in-button.tsx`); must also be registered under Supabase Auth → Providers → Google. Create a **Web application** OAuth client in Google Cloud Console with `http://localhost:3000` in its authorized origins. Restart the dev server after changing it (`NEXT_PUBLIC_*` vars are read at startup).
- `NEXT_PUBLIC_VAPID_KEY` — web push, paired with the `kori-send-push` Supabase Edge Function (`lib/api/push.ts`, `public/sw.js`).

## Project Structure

```text
app/
  (auth)/          login, register
  (main)/          app shell + every feature page
    layout.tsx     sidebar, mobile tabs, immersive-chat handling
    chat/          AI Coach (Chat / Analyze / Generate / Corrections tabs)
    practice/      Today — Daily Practice Hub
    goals/  dashboard/  achievements/  vocab/  reading/  listening/
    interview/     Exam Prep (+ interview/script — script writer)
    learn/         Foundations (Survival / Alphabet / Grammar lessons)
    scenarios/     Roleplay Scenarios
    roadmap/       Learning Roadmap
    history/       Progress Lab
    notes/         Dev Notes (knowledge library), notes/new, notes/[slug]
    settings/      Settings (account/ is an alias)
    mistakes/  daily-phrase/   redirect stubs — keep them
  api/ai/          AI route handlers (the only server-side code)
components/
  ui/              reusable shadcn-style primitives (keep generic)
  chat/  ai/  vocab/  goals/  calendar/  reading/  dashboard/  learn/  notes/  ...
hooks/             useChat, useVocab, useFoundations, useGoals, useNotes, etc.
lib/
  api/             Supabase integration — per-domain service package (barrel: index.ts)
  server/ai.ts     shared plumbing for app/api/ai/* (requireUser, jsonAiRoute, SSE)
  supabase.ts      single browser Supabase client
  auth-store.ts    reads the persisted session (storage key "koriai-auth")
  goals.ts  reading.ts  vocab-review.ts  srs.ts  study-plan.ts  ...
```

Other repo notes:

- `dev-learning-notes/` is an unrelated embedded side project (own README/CLAUDE.md) — not part of the app; don't wire it in.
- `GuideLineNew.md` holds the full product vision and module list; `STUDY-PLAN.md`, `FOUNDATIONS_BACKEND.md`, `INTEGRATION.md` are working docs (INTEGRATION.md predates the Supabase migration and is partly stale).

## Deployment

- Frontend + AI routes → Vercel (one deployment; there is no separate backend to run).
- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `OPENAI_API_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, and `NEXT_PUBLIC_VAPID_KEY` on the platform, then `pnpm build` / `pnpm start`.

---

Built by **Hen Heang** — 2026.
