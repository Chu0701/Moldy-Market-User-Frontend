---
name: moldy-auth-guard
description: Use when implementing login, register, logout, token handling, 401/403 handling, session bootstrap, route guards, or role-based UI in a Moldy Market frontend repo.
---

# Auth and guards

> Current override (2026-11-22): read the approved HANDOFF-APPRAISER-FRONTEND.md in the repository documentation first. Q2 is resolved: access token in the app-specific localStorage module; refresh token in a Backend-set HttpOnly cookie, withCredentials and X-Moldy-Auth header on auth requests. Never read/store a refresh token in JavaScript. Current session key is [users, me]. Email OTP activates accounts directly; admin must not bypass OTP. Staff resource permissions require the actual same-store membership, not merged role permissions. The older token/activation/session-key proposals below are historical and must not override these decisions.

Read `docs/08-AUTHENTICATION-AND-AUTHORIZATION.md` and doc 14 section 3 first (only those sections).

Verified Backend facts (2026-11-22): access token 15 min, refresh token 30 days stored in Backend-set HttpOnly cookie (`moldy_refresh`, `Path=/api/v1/auth`), refresh rotates; reusing an old refresh token (`AUTH_007`) makes Backend revoke ALL sessions of the user. Auth calls (`/login`, `/refresh`, `/logout`) require `withCredentials: true` and header `X-Moldy-Auth: 1`; `/refresh` and `/logout` send `undefined` body. JWT only carries sub/email/tokenType. `GET /api/v1/users/me` returns `roles`, `permissions`, and `storeId`; staff shop permissions must be read from `GET /api/v1/stores/my-store/staff/me` (`STORE_WORKSPACE_ACCESS`), never inferred from merged `/users/me` permissions. Authorization is per request on Backend. New registered users are `PENDING_VERIFICATION` and activate via Email OTP (`POST /api/v1/auth/verify-email`); admin must NOT bypass OTP.

Implementation rules:

- Access token storage (resolved): put ALL read/write in `src/lib/tokenStorage.js` (`moldy-market:user:access-token` in `localStorage` for User app; `moldy-market:admin:access-token` for Admin app). Refresh token is an HttpOnly cookie — JavaScript must never read/write it. Do not scatter storage calls.
- 401 handling in `src/services/api/authRefreshInterceptor.js`: refresh ONCE with a single shared in-flight promise, queue other failed requests, replay them after success; if refresh fails, clear access token, reset Query cache, redirect to `/login` with return path (`state={{ from }}`). Never loop, never refresh on `/api/v1/auth/*`. For `PUT /api/v1/users/me/password`, a 401 with code `INVALID_CREDENTIALS` means the current password is wrong and must not refresh; other expired-token 401s still use refresh-once. Never refresh on 403.
- Session state: keep the user object in TanStack Query under `meQueryKey = ['users', 'me']` (`useSession`), not Zustand. Subscribe to token changes via `tokenStorage`.
- Guards live in `src/app/router/`: `RequireAuth` (redirects to `/login` with `state={{ from }}`), `GuestOnly` (wraps `/login`). `RequireRole` (role names from `/users/me`, UX only) and `RequireStoreAccess` should be added when needed; treat Backend 403 as final truth and show `ForbiddenState`.
- Admin app: allow entry only if `/users/me` roles include `ADMIN`; otherwise sign out locally and show a message. Backend remains the real gate (B2 still open on Wallet/Escrow/Withdrawal).
- 403: show `ForbiddenState` (`components/feedback`), do not retry. Logout: clear local token and Query cache immediately, await any pending refresh, call `POST /api/v1/auth/logout` (`withCredentials: true`, `X-Moldy-Auth: 1`), and navigate to `/login` regardless of result.
- Never log tokens, never put them in URLs, never display them.
