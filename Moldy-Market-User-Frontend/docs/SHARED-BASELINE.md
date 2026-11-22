# Shared baseline — publication 22/11/2026

Status: FRONTENDS_READY_BACKEND_PENDING. Chu authorized committing and pushing the latest code to main in all three repositories. This publication is in progress; do not treat the Backend ref below as the completed integrated baseline.

## Repositories and code refs

- User Frontend: https://github.com/Chu0701/Moldy-Market-User-Frontend — application code ref `9cc5a03b8644632af56982f5421bcb02451b83e2`. This includes checkout/payment/order/store integration, chat/read-unread and the remote auth merge. Documentation commits after it do not change application code.
- Admin Frontend: https://github.com/Chu0701/Moldy-Market-Admin-Frontend — main `72587dbe7992d2677f631675db1542c720208b10`. Scaffold/configuration plus the approved Admin handoff and agent guidance; no Admin auth/business implementation is claimed.
- Backend: https://github.com/Qt159/Moldy-Market — remote main remains `dc11b09` at this checkpoint. New local auth/cart commits are `8fd8bb1` and `07ef520`; checkout/payment/store/chat changes still await snapshot integration tests before publication. **Do not use dc11b09 as if it includes the new frontend's entire API contract.**

## Verification and current blocker

- Frontend commerce/staff snapshot: 381/381 tests passed, lint/build passed.
- Complete User Frontend snapshot: 449/449 tests in 49 files, format/lint/format check/build passed. Merging origin/main changed no application files, so this evidence still applies.
- Admin: format/lint/format check/build passed; test command exits successfully with no test files. It has no behavior-test coverage yet.
- Backend auth snapshot: 60 tests, 59 passed and one pre-existing disabled QA-010. Cart snapshot: 26/26 passed.
- Backend whole-tree verify on 21/11 passed 314 tests, 313 passed and the same disabled test. On 22/11 the commerce snapshot compiles, but HTTP/PostgreSQL integration tests cannot start because PostgreSQL at 127.0.0.1:5432 is stopped. Windows denied the assistant permission to start postgresql-x64-18. Current integration results are infrastructure errors, not a new successful verify; no tests have been disabled to conceal this.

Once PostgreSQL is restored, complete Backend snapshot tests/commits, push main and replace this pending status with the exact published Backend ref. No secrets, environment files, build outputs, local backups or installer files belong to the baseline.

## Starting work

Use a fresh clone of the appropriate repository's main, or fetch first and inspect local status before updating an existing checkout. Never discard a teammate's local changes. One shared baseline consists of separate refs for all three repositories, not a single SHA.

The Appraiser developer works in User Frontend and reads HANDOFF-APPRAISER-FRONTEND.md. The Admin developer works in the separate Admin repository and reads HANDOFF-ADMIN-FRONTEND.md. Both retain the same JavaScript/JSX layers, API/session conventions, tokens and design system. Admin ports selected infrastructure instead of importing code across repositories.

Backend enforcement of the newly approved Appraiser own-product/owned-store/staff-store restriction and admin OTP bypass restriction is still pending. Those decisions are documented business requirements, not features implemented by this publication. Appraisal conversationId is still a known placeholder pending a separate Backend fix. Do not silently invent endpoints or bypass guards to fill these gaps.
