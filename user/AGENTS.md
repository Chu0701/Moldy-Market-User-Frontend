# AGENTS.md (Moldy Market Frontend; Moldy-Market-User-Frontend)

Owner: Chu (Vietnamese). Talk to the owner in Vietnamese with English technical terms. Code, comments, JSDoc, commits in English.
Project: Moldy Market, a C2C secondhand marketplace (graduation project). This repo is one of two independent React apps: User Frontend and Admin Frontend. The Spring Boot Backend is a separate repo.

## Current decisions and handoff (2026-11-21)

Read `Moldy-Market-User-Frontend/docs/HANDOFF-APPRAISER-FRONTEND.md` before implementing. Its approved decisions and current-source notes supersede the 2026-11-10 Project state and old Q2/B10 guidance below. Access tokens use the app-specific localStorage token module; refresh tokens are Backend-set HttpOnly cookies. Email OTP activates accounts without routine admin approval; admin must not bypass OTP. Appraiser self/owned-store/staff-store appraisal is prohibited by approved policy, but Backend implementation is still pending. Admin MVP is auth, users, stores, moderation and categories. Git publication is authorized only when explicitly requested by the user; never force-push.

## Token discipline (important)

- Never read all of `docs/`. Use the reading map below and read only the section you need (grep headings first).
- Never scan the Backend repo. The verified contract is `docs/14-BACKEND-INTEGRATION-MATRIX.md`. Open Backend code only if doc 14 lacks the fact, then grep one controller/DTO, and record the finding in doc 14.
- Do not re-read files you just wrote. Prefer small diffs. One feature per task.

## Stack (installed, JavaScript only, no TypeScript, use JSDoc)

Vite, React 19, Tailwind CSS 4 (config in `src/index.css`, no tailwind.config), shadcn/ui (radix-nova; only `button` added so far), react-router 7 (import from `react-router`; `RouterProvider` from `react-router/dom`), axios, TanStack Query 5, Zustand 5, react-hook-form + zod 4 + @hookform/resolvers, i18next (default `vi`, fallback `vi`, namespace `common`), ESLint 10 flat config, Prettier (no semi, single quotes, width 100), Vitest + RTL (verify it is configured: check `package.json` scripts `test`).
Alias `@` = `src`. Dev proxy: `/api` -> `API_PROXY_TARGET` (default http://localhost:8080). Axios `baseURL` = `import.meta.env.VITE_API_BASE_URL || ''`; never hard-code `/api/v1` (Backend has both `/api/v1/...` and `/api/...`).

## Folder layers (do not break)

- `src/services/<module>/`: pure async API functions, no React, unwrap the `ApiResponse {success, code, message, data, timestamp}` envelope. Some endpoints return no body.
- `src/features/<module>/{components,hooks,pages,schemas}`: UI + TanStack Query hooks + Zod schemas.
- `src/components/{common,feedback,navigation}`: shared. `src/components/ui`: shadcn generated, never hand-edit (add via `npx shadcn@latest add <name>`).
- `src/state/`: Zustand for client UI state only. Never store API responses there (that is TanStack Query's job). Named `state`, not `stores` (store = shop).
- `src/app/{providers,router,layouts}`, `src/hooks`, `src/lib`, `src/constants`, `src/i18n`.
- Empty folders hold `.gitkeep`; delete it when adding a real file.

## Hard rules

1. Only write a service/hook for endpoints marked IMPLEMENTED in doc 14. For IN_PROGRESS/PLANNED/NOT_FOUND build UI skeleton + `TODO(doc14:<id>)` only, no fake API calls, no mock endpoints, no invented DTOs/enums/permissions.
2. Frontend is not a security boundary. Backend 401/403 is final. Hide UI by role only as UX.
3. Access token storage is resolved: use `src/lib/tokenStorage.js` (`moldy-market:user:access-token` in `localStorage`); refresh token is a Backend-set HttpOnly cookie (`moldy_refresh`) using `withCredentials: true` and `X-Moldy-Auth: 1`. Session roles/permissions come from `GET /api/v1/users/me` (`meQueryKey = ['users', 'me']`); staff shop permissions come from `GET /api/v1/stores/my-store/staff/me`. Do not scatter storage calls or infer shop permissions from merged `/users/me` permissions.
4. Payment: never mark success on the client; trust only `paymentStatus === "SUCCESSFUL"` from polling. QR is Backend's `qrBankUrl`.
5. Update with `version` for products (409 `COMMON_010` = stale data, refetch).
6. UI text only through i18n keys (vi first, en mirrored). Do not translate Backend enums/codes; map them to keys.
7. Styling only with design tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-accent`, `border-border`, success/warning/info). No hard-coded hex. Headings h1-h3 get Playfair automatically.
8. Do not push, do not force anything. Never edit `.env.local`. Commit only when asked, Conventional Commits, one logical change each.
9. Before finishing any task run: `npm run format`, `npm run lint`, `npm run build`, and `npm run test` if tests exist. Fix, do not skip.

## Reading map (docs/)

- Which route/page exists, guards, status: `04-ROUTING-AND-PAGES.md`
- Page behavior, fields, validation, states: `05-PAGE-BY-PAGE-GUIDE.md` (one page section)
- Where a component goes, props conventions: `06-COMPONENT-ARCHITECTURE.md`
- Axios, errors, pagination shapes, endpoint table: `07-API-INTEGRATION.md`
- Auth/refresh/roles: `08-AUTHENTICATION-AND-AUTHORIZATION.md`
- Query keys, Zustand, forms: `09-STATE-MANAGEMENT.md`
- Flow diagrams: `10-FEATURE-FLOWS.md` (one flow)
- Style/naming: `11-CODING-CONVENTIONS.md`; design tokens: `03-DESIGN-SYSTEM.md`
- Env/build: `12`; order of work: `13-DEVELOPMENT-ROADMAP.md`; PR rules: `15-CONTRIBUTING.md`
- Backend truth (endpoints, DTO limits, error codes, Bn issues, Qn questions): `14-BACKEND-INTEGRATION-MATRIX.md`

## Project state (2026-11-27)

DONE:
- Tooling & config: Vite 8, React 19, Tailwind 4 semantic `@layer components` tokens (`src/index.css`), shadcn (`button`), ESLint 10, Prettier, Vitest + RTL (`85` test files, `564+` passing tests), GitHub Actions CI, `@stomp/stompjs` + `sockjs-client`, Vite proxy (`/api` and `/chat`).
- App shell & core API: `AppProviders`, `queryClient`, `MainLayout` (fixed-height sticky header without scroll oscillation), `AuthLayout`, `StoreDashboardLayout`, `AppraiserLayout`, `routes.js` (lazy routes + `RequireAuth`, `GuestOnly`, `RequireRole`, `RequireAdminRole`), `src/services/api/{client,unwrap,ApiError,pagination,authRefreshInterceptor}.js` (including `normalizeOfferPage`), `src/lib/tokenStorage.js`, full `vi`/`en` i18n parity.
- Implemented features (`src/features/` + `src/services/` — 21 modules):
  - `auth` (login, register, email OTP verify/resend, forgot-password, logout, HttpOnly cookie refresh), `profile` (view/edit/avatar upload, change password).
  - `marketplace` (home, category), `products` (search + facets, 3-tier `ProductPurchaseBox` + upgraded `MobileBuyBar`, `allowOffer` create/edit toggle, versioned edit, visibility, delete, compare, recently viewed).
  - `stores` (public storefront, open store, store dashboard overview/profile/products/staff/orders/offers/vouchers/revenue/reviews; staff permissions strictly read via `GET /api/v1/stores/my-store/staff/me` in `getStoreContext`).
  - `offers` (buyer `/offers` & store `/store/offers` with filter tabs + live `OfferCountdown` + history modal; upgraded `MakeOfferModal` with VND dot-formatting, 75%–<100% bounds, `-5%/-10%/-15%` pills, optional `note`, 24h escrow copy; interactive `ChatOfferCard` + `ChatPinnedOfferBar` inside Chat; accepted-offer pricing & savings in `CartPage`/`CheckoutPage` with voucher stacking disabled `OFF_010`).
  - `chat` (inbox, STOMP/SockJS realtime text + images + structured Offer cards via `message.offerId`, Messenger-style peer avatars, bounded read cursors + `/user/queue/chat-reads`, clickable URLs, quick Make Offer button in composer).
  - `cart` (qty=1), `checkout` (SePay QR polling, COD, voucher check, accepted-offer pricing), `orders`, `payments` (`transactions`), `disputes`, `wallet` (balance, withdrawals, balance history), `notifications` (DynamoDB cursor), `wishlist`, `vouchers`, `analytics` (seller revenue + price history), `reviews`, `pricing` (auto-pricing), `appraiser` (appraiser workspace + seller appraisals + admin appraiser pages).

NOT DONE / OPEN:
- Some pre-existing legacy components still import `@/services/` directly instead of feature hooks; keep new code strictly layered (`services -> hooks -> components/pages`).
- Cross-origin cookie deployment still requires Backend CORS `allowCredentials(true)` + `X-Moldy-Auth` allowed header if deployed on separate origins without reverse proxy.
- Follow-store API is `NOT_FOUND`. `GET /api/v1/orders/me` still returns `404 ORDER_003` when empty (FE safely falls back to `[]`).

## Skills

Use the skills in `.agents/skills/`: `moldy-task-start` first on every task, then `moldy-feature`, `moldy-api-service`, `moldy-ui`, `moldy-auth-guard` as needed.
