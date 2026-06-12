# Environments

This app does not use traditional `environment.ts` / `environment.prod.ts` files for API URLs or feature flags.

Runtime configuration is loaded from the **vertical** API via `VerticalService` at startup (see `app.config.ts` `APP_INITIALIZER`). White-label partners receive branding, API keys, and navigation from the server.

## Files in this folder

- `login-defaults.generated.ts` — build-time login defaults (import via `@env/login-defaults.generated`)

## When to add environment files

Add `environment.ts` only if you need compile-time constants that never change per vertical (e.g. local dev API override). Prefer `VerticalService` for anything partner-specific.
