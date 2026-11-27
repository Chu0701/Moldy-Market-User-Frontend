# Moldy Market — User Frontend (`Moldy-Market-User-Frontend`)

Web application cho **Người mua**, **Chủ / Nhân viên gian hàng** và **Thẩm định viên (Appraiser)** của nền tảng thương mại điện tử đồ cũ C2C **Moldy Market**.

## Tech Stack

- **Runtime & Build:** Node 22 (`.nvmrc`), Vite 8, React 19, JavaScript (ESM + JSDoc, no TypeScript)
- **Routing & State:** React Router v7 (`createBrowserRouter` + lazy routes), TanStack Query v5, Zustand v5 (UI state only)
- **Forms & Validation:** `react-hook-form` + Zod v4 + `@hookform/resolvers`
- **Styling & UI:** Tailwind CSS v4 (`@layer components` semantic classes & design tokens in `src/index.css`), shadcn/ui (`radix-nova`), `lucide-react`
- **i18n:** `i18next` (`vi` default, `en` mirrored, namespace `common`)
- **Realtime Chat:** `@stomp/stompjs` + `sockjs-client` (STOMP over SockJS `/chat`)
- **Testing & Quality:** Vitest + React Testing Library, ESLint 10, Prettier

## Scripts

```bash
npm install
npm run dev           # Vite dev server (default http://localhost:5173, proxies /api & /chat -> http://localhost:8080)
npm run format        # Prettier write
npm run format:check  # Prettier verify
npm run lint          # ESLint
npm run test          # Vitest (all unit & integration tests)
npm run build         # Production Vite build
```

## Implemented Feature Modules (`src/features/`)

`analytics`, `appraiser`, `auth`, `cart`, `chat`, `checkout`, `disputes`, `marketplace`, `notifications`, `offers`, `orders`, `payments`, `pricing`, `products`, `profile`, `reviews`, `stores`, `system`, `vouchers`, `wallet`, `wishlist`.

## Documentation & Agent Onboarding

- Agent rules & reading map: [`user/AGENTS.md`](./user/AGENTS.md) and `user/.agents/skills/`
- Cross-repo shared baseline: [`Moldy-Market-User-Frontend/docs/SHARED-BASELINE.md`](./Moldy-Market-User-Frontend/docs/SHARED-BASELINE.md)
- Routes & pages catalog: [`Moldy-Market-User-Frontend/docs/04-ROUTING-AND-PAGES.md`](./Moldy-Market-User-Frontend/docs/04-ROUTING-AND-PAGES.md)
- Backend contract matrix: [`Moldy-Market-User-Frontend/docs/14-BACKEND-INTEGRATION-MATRIX.md`](./Moldy-Market-User-Frontend/docs/14-BACKEND-INTEGRATION-MATRIX.md)
- Master 3-repo Codex onboarding doc: `CODEX_HANDOFF.md` in Backend repository (`Moldy-Market`).
