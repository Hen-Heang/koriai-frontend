# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

KoriAI — frontend for a Korean language-learning platform aimed at software developers working in Korea (workplace/technical Korean). Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui. The full product vision and module list live in `GuideLineNew.md`.

## Commands

Use **pnpm**.

```bash
pnpm dev          # dev server at localhost:3000
pnpm build        # production build
pnpm lint         # eslint
npx vitest run    # run all tests (no "test" script in package.json)
npx vitest run lib/vocab-review.test.ts   # run a single test file
```

Tests are plain vitest unit tests colocated in `lib/*.test.ts` — there is no vitest config file; defaults apply.

**Local dev on machines with corporate SSL inspection** (this repo is developed on one running Somansa): Node.js does not trust the interception CA, so every server-side fetch — Supabase auth in `requireUser`, OpenAI calls — fails with `SELF_SIGNED_CERT_IN_CHAIN` and all `app/api/ai/*` routes return 401 "Invalid session" even for valid logins. Run the dev server with `NODE_EXTRA_CA_CERTS` pointing at the exported root CA (here: `C:\Users\user\.certs\somansa-root-ca.pem`). Browser-side Supabase calls are unaffected, so the symptom is "everything works except AI".

## Architecture

**Client-side SPA over Supabase, plus a thin set of Next.js AI routes.** The former Spring Boot backend was replaced (July 2026): data now lives in Supabase and the AI features run in `app/api/ai/*` route handlers — the only server-side code in the app. The old Spring implementations were removed in this migration's cleanup; see git history if they're ever needed again.

### Supabase — data + auth

- `lib/supabase.ts` holds the single browser client. The Supabase project is **shared with Orbit/DailyGoalMap**: KoriAI-owned tables are prefixed `kori_`; the goals/tasks domain reuses Orbit's original tables (`goals`, `tasks`, …) and RPCs. All tables have RLS; queries rely on it rather than filtering by user id everywhere.
- Auth is Supabase auth (email/password + Google via `signInWithIdToken`, see `lib/google-auth.ts`). Session persists under the fixed storage key `koriai-auth` so `lib/auth-store.ts` can read the user id synchronously. The route guard is client-side only: `app/(main)/layout.tsx` redirects to `/login`.

### API layer — `lib/api/` (the single integration point)

- Per-domain service package: each domain file (`auth.ts`, `chat.ts`, `vocab.ts`, `goals.ts`, `interview.ts`, `reading.ts`, `progress.ts`, `learning.ts`, `foundations.ts`, `tts.ts`, `push.ts`, `user.ts`, `notes.ts`) queries Supabase directly and maps snake_case rows to the app's camelCase types. `lib/api/index.ts` is a barrel — import from `@/lib/api` (e.g. `import { vocabApi, getApiErrorMessage } from "@/lib/api"`). Add a new backend call to the matching domain file, not inline in components.
- `lib/api/errors.ts` — `getApiErrorMessage` formats supabase-js / fetch errors; used by most hooks and pages.
- `lib/api/ai-client.ts` — `aiPost` / `authHeaders` attach the Supabase access token for calls to `app/api/ai/*`. `lib/api/sse.ts` parses the SSE streams.

### AI routes — `app/api/ai/*`

- `lib/server/ai.ts` is the shared plumbing: `requireUser` (verifies the caller's Supabase JWT and returns a per-request client so **RLS applies — no service key anywhere**), `jsonAiRoute` (zod schema + prompt → `generateObject` → JSON), and SSE helpers.
- Models via `@ai-sdk/openai`; server-side `OPENAI_API_KEY`, default model `gpt-5-mini` (override with `AI_MODEL`). TTS (`app/api/ai/tts`) proxies OpenAI's audio API and returns MP3 bytes.
- Streaming (`chat/stream`, `goals/coach`) keeps the same SSE event protocol the Spring backend used: `start` / `token` / `done` / `error`. `chat/stream` also persists both message rows in `kori_messages`.

### Routing & app shell

- Route groups: `app/(auth)/` (login, register) and `app/(main)/` (everything else).
- `app/(main)/layout.tsx` is the entire app shell: contextual desktop sidebar, mobile top bar, mobile bottom tab bar, soft-keyboard detection via `visualViewport`.
- **Nav is data-driven:** `lib/navigation.ts` is the single source of truth — four workspaces (`Learning`, `Productivity`, `AI`, `Progress`) that the sidebar, bottom tabs, and mobile "More" sheet all render from. Add, move, or hide features there (a `soon` flag renders a disabled entry), not in the shell. The desktop sidebar shows only the active workspace's links (`getWorkspaceForPath`) below an icon-only workspace-switcher row.
- `/home` is the workspace gate: two poster cards (Learning / Productivity) that deep-link to the last route visited in each workspace (`lib/last-visited.ts`).
- `/mistakes` and `/daily-phrase` are deliberate redirect stubs (→ `/chat?mode=corrections` and `/practice`) kept so old bookmarks still work — don't delete them.
- **Immersive routes:** on `/chat` and `/home` the mobile header, bottom tabs, and content padding are all removed for a full-bleed experience (`/home` also drops the desktop sidebar and top bar). If you touch chat layout, check the shell's `isChatRoute` / `isHomeRoute` branches and `components/chat/ChatWindow.tsx`.

### Data state

- TanStack Query is provided globally (`components/providers/app-providers.tsx`, staleTime 60s, no refetch on focus), but several hooks (`useChat`, parts of others) manage state manually with `useState` + direct api calls.
- `useChat` injects response-language and "Dev Mode" (technical Korean) instructions into the outgoing message text rather than via API parameters.

## Environment (`.env.local`)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — shared Orbit project.
- `OPENAI_API_KEY` — server-side, required for every `app/api/ai/*` route (set it in Vercel too when deploying).
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — must also be registered under Supabase Auth > Providers > Google.
- `NEXT_PUBLIC_VAPID_KEY` — web push, paired with the `kori-send-push` Edge Function.
- Optional: `AI_MODEL`, `TTS_MODEL`.

## Conventions

- `components/ui/*` are shadcn/ui-style reusable primitives — keep them generic; feature-specific components live in `components/<feature>/`.
- Tailwind v4 (CSS-based config in `app/globals.css`; there is no `tailwind.config`). Dark mode via `next-themes` with `attribute="class"`.
- Animations use `motion/react` (the `motion` package), icons from `lucide-react`, toasts via `sonner`.
- Path alias `@/*` maps to the repo root.
- Mobile UI is tuned for iPhone 12 Pro Max: use `env(safe-area-inset-*)` padding and `100dvh`-style units as the existing layouts do.
- `dev-learning-notes/` is an unrelated embedded side project (own README/CLAUDE.md) — not part of the app; don't wire it in.
