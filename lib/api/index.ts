// Barrel for the API service package. Re-exports every per-domain group so
// callers keep importing from "@/lib/api" unchanged
// (e.g. `import { vocabApi, getApiErrorMessage } from "@/lib/api"`).
export * from "./errors"
export * from "./auth"
export * from "./chat"
export * from "./user"
export * from "./vocab"
export * from "./reading"
export * from "./interview"
export * from "./goals"
export * from "./progress"
export * from "./learning"
export * from "./foundations"
export * from "./tts"
export * from "./push"
export * from "./notes"
export * from "./recovery"
export * from "./habits"
