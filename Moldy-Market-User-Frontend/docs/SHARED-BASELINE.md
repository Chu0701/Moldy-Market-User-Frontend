# Shared baseline — latest update 27/11/2026

## Latest published checkpoints (2026-11-27)

- **Backend:** https://github.com/Qt159/Moldy-Market — `main` at `f3ca06a` (includes Offer negotiation RBAC + store delegation + 24h checkout TTL + `OFF_010` voucher lock + enriched `OfferResponse`, `Product.allowOffer` default `true`, and `OfferChatEventListener` + `Message.offerId` STOMP mirroring). Verified targeted unit suites (`OfferServiceTest` 14/14, `CheckoutGroupServiceTest` 15/15, `OfferChatEventListenerTest` 2/2) + full unit regression (`338/338` prior checkpoint).
- **User Frontend:** https://github.com/Chu0701/Moldy-Market-User-Frontend — `main` at `361ea90` (includes full Offer feature `/offers` & `/store/offers`, `allowOffer` product toggle, interactive `ChatOfferCard` + `ChatPinnedOfferBar` + Messenger peer avatars in Chat, Cart/Checkout accepted-offer pricing & voucher lock, 3-tier `ProductPurchaseBox` + upgraded `MobileBuyBar`, and fixed `MainLayout` sticky header scroll oscillation). Verified Prettier, ESLint (0 errors), Vitest, and Vite production build.
- **Admin Frontend:** https://github.com/Chu0701/Moldy-Market-Admin-Frontend — `main` at `b285031` (includes API layer with `moldy-market:admin:access-token`, shared feedback/common UI, `@layer components` CSS system, login-free `AdminLayout` shell per Chu's temporary dev instruction, and Group 2 modules: Disputes `/disputes` & `/disputes/:disputeId`, Withdrawals `/withdrawals`, Platform Vouchers `/vouchers`). Verified Prettier, ESLint (0 errors), Vitest 6/6 files (13/13 tests), and Vite build.

---

# Historical baseline — publication 22/11/2026

Status: PUBLISHED. Chu authorized committing and pushing the latest code to main in all three repositories. Backend and both frontend publication refs below were verified against GitHub main. Subsequent documentation-only commits may advance main without changing the tested application checkpoints.

## Repositories and code refs

- User Frontend: https://github.com/Chu0701/Moldy-Market-User-Frontend — application code ref `9cc5a03b8644632af56982f5421bcb02451b83e2`. This includes checkout/payment/order/store integration, chat/read-unread and the remote auth merge. Documentation commits after it do not change application code.
- Admin Frontend: https://github.com/Chu0701/Moldy-Market-Admin-Frontend — main `72587dbe7992d2677f631675db1542c720208b10`. Scaffold/configuration plus the approved Admin handoff and agent guidance; no Admin auth/business implementation is claimed.
- Backend: https://github.com/Qt159/Moldy-Market — published main `d530c23cb26af022f7295aa54ca42f4d71f28e79`, verified code/test checkpoint `25be4d4bf9a91fa918d1cdbe23874349093fc24f`. Includes auth/OTP, cart restrictions, reserved checkout/payment/store orders, chat/read receipts and regression tests. The final commit adds verified rollout documentation without changing application code.

## Verification

- Frontend commerce/staff snapshot: 381/381 tests passed, lint/build passed.
- Complete User Frontend snapshot: 449/449 tests in 49 files, format/lint/format check/build passed. Merging origin/main changed no application files, so this evidence still applies.
- Admin: format/lint/format check/build passed; test command exits successfully with no test files. It has no behavior-test coverage yet.
- Backend auth snapshot: 60 tests, 59 passed and one pre-existing disabled QA-010. Cart snapshot: 26/26 passed.
- Backend commerce/store snapshot: 140/140 passed. Chat snapshot: 25/25 passed, including real HTTP/STOMP/PostgreSQL tests.
- Final Backend Maven verify/package on 22/11 rebuilt from a fresh snapshot target and passed 314 tests: 313 passed, one pre-existing disabled QA-010, zero failures/errors. All 111 candidate source/build files matched the verified snapshot. An earlier connection-refused failure was resolved when PostgreSQL in Docker was restored; no tests were disabled to work around it.

The Backend publication blocker is resolved. No secrets, environment files, build outputs, local backups or installer files were included. A configured credential in an unpublished local report was replaced with a placeholder before its first commit/publication.

## Starting work

Use a fresh clone of the appropriate repository's main, or fetch first and inspect local status before updating an existing checkout. Never discard a teammate's local changes. One shared baseline consists of separate refs for all three repositories, not a single SHA.

The Appraiser developer works in User Frontend and reads HANDOFF-APPRAISER-FRONTEND.md. The Admin developer works in the separate Admin repository and reads HANDOFF-ADMIN-FRONTEND.md. Both retain the same JavaScript/JSX layers, API/session conventions, tokens and design system. Admin ports selected infrastructure instead of importing code across repositories.

Backend enforcement of the newly approved Appraiser own-product/owned-store/staff-store restriction and admin OTP bypass restriction is still pending. Those decisions are documented business requirements, not features implemented by this publication. Appraisal conversationId is still a known placeholder pending a separate Backend fix. Do not silently invent endpoints or bypass guards to fill these gaps.
