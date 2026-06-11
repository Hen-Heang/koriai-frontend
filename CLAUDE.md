# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

KoriAI — frontend for a Korean language-learning platform aimed at software developers working in Korea (workplace/technical Korean). Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui. The full product vision and module list live in `GuideLineNew.md`.

## Commands

Use **pnpm** (README convention; ignore the stray `package-lock.json`).

```bash
pnpm dev          # dev server at localhost:3000
pnpm build        # production build
pnpm lint         # eslint
npx vitest run    # run all tests (no "test" script in package.json)
npx vitest run lib/speaking.test.ts   # run a single test file
```

Tests are plain vitest unit tests colocated in `lib/*.test.ts` — there is no vitest config file; defaults apply.

## Architecture

**This is effectively a client-side SPA over a separate Spring Boot backend.** Nearly every page/layout is `"use client"`. There are no Next.js API routes or server actions. All data comes from the backend at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8080/api`); the backend repo is separate.

### API layer — `lib/api.ts` (the single integration point)

- One axios instance plus per-domain endpoint groups (`authApi`, `chatApi`, `vocabApi`, `listeningApi`, `analyzerApi`, etc.). Add new backend calls here, not inline in components.
- The backend wraps every payload in an envelope — responses are always unwrapped with `r.data.data`. Keep that pattern.
- Request interceptor attaches `Authorization: Bearer <token>` from localStorage; response interceptor on 401 clears auth and hard-redirects to `/login`.
- `chatApi.streamMessage` is the exception to axios: it uses raw `fetch` to parse SSE events (`start` / `token` / `done` / `error`) from `POST /chat/stream`.

### Auth

- JWT stored in localStorage via `lib/auth-store.ts` (`token`, `userId`, `userEmail` keys).
- The route guard is client-side only: `app/(main)/layout.tsx` redirects to `/login` when `isAuthenticated()` is false.
- `lib/auth.ts` (NextAuth config) is an unwired stub — real auth goes through `authApi` + `auth-store`.

### Routing & app shell

- Route groups: `app/(auth)/` (login, register) and `app/(main)/` (everything else).
- `app/(main)/layout.tsx` is the entire app shell: desktop sidebar, mobile top bar, mobile bottom tab bar, soft-keyboard detection via `visualViewport`. Nav links for hidden features (Correction, Diary) are commented out in place for easy restore — keep that convention.
- **Immersive chat:** on `/chat` routes the mobile header, bottom tabs, and content padding are all removed for a full-bleed experience. If you touch chat layout, check both the shell's `isChatRoute` branches and `components/chat/ChatWindow.tsx`.

### Data state

- TanStack Query is provided globally (`components/providers/app-providers.tsx`, staleTime 60s, no refetch on focus), but several hooks (`useChat`, parts of others) manage state manually with `useState` + direct api calls. Some hooks/pages still use mock/demo data where the backend isn't wired — check before assuming an endpoint exists (README "Integration Status" table tracks this).
- `useChat` injects response-language and "Dev Mode" (technical Korean) instructions into the outgoing message text rather than via API parameters.

## Conventions

- `components/ui/*` are shadcn/ui-style reusable primitives — keep them generic; feature-specific components live in `components/<feature>/`.
- Tailwind v4 (CSS-based config in `app/globals.css`; there is no `tailwind.config`). Dark mode via `next-themes` with `attribute="class"`.
- Animations use `motion/react` (the `motion` package), icons from `lucide-react`, toasts via `sonner`.
- Path alias `@/*` maps to the repo root.
- Mobile UI is tuned for iPhone 12 Pro Max: use `env(safe-area-inset-*)` padding and `100dvh`-style units as the existing layouts do.
