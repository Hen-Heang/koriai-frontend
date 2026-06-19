// Barrel for the API service package. Re-exports the shared axios client and
// every per-domain group so callers keep importing from "@/lib/api" unchanged
// (e.g. `import { vocabApi, getApiErrorMessage } from "@/lib/api"`).
export * from "./client"
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

export { default } from "./client"
