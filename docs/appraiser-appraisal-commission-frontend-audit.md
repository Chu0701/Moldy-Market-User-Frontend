# Appraiser, Appraisal, and Commission Frontend Audit

Date: 2026-11-25

## Scope and architecture found

The User Frontend already contains an Appraiser workspace under `src/features/appraiser/`, API modules under `src/services/appraiser/`, `src/services/appraisal/`, and `src/services/commission/`, and the shared React Router table in `src/app/router/routes.js`. The appraiser pages use the shared session, Axios client, TanStack Query, i18n, feedback states, and design tokens. Seller appraisal management and Admin appraisal/commission management are not present as User Frontend features.

The separate Admin Frontend ownership and current handoff are retained: Admin appraiser management is not added to this User Frontend. The source/contract notes are in doc 14 and `HANDOFF-APPRAISER-FRONTEND.md`; they are source-level references, not deployed HTTP/security verification.

## Existing pages and API mapping

| Area                          | Current UI/service mapping                                                                                                                                | Readiness                                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appraiser profile             | `/appraiser/profile`; register/get/update/status/deactivate/reactivate via `/api/v1/appraisers/**`                                                        | Source contract exists; runtime and authorization remain unverified                                                                                   |
| Open requests                 | `/appraiser/requests`; `GET /api/v1/appraisal-requests/market/open`; request detail and apply use `GET /{requestId}` and `POST /{requestId}/applications` | Source contract exists; Backend role guard for apply is an open security issue                                                                        |
| Applications/invitations      | `/appraiser/opportunities?tab=applications                                                                                                                | invitations`; application withdraw and invitation actions use `appraisalService.js`                                                                   | UI currently integrates source-referenced endpoints; role/ownership/runtime require HTTP tests |
| Assignments/reports           | `/appraiser/assignments`, `/appraiser/assignments/:assignmentId`; start, cancel, submit report, history                                                   | Source contract exists; report URL upload is not integrated; Backend authorization/runtime require tests                                              |
| Commission                    | `/appraiser/commissions`; existing `AppraiserCommissionsPage` is an explicit unavailable state                                                            | No commission request is made from the route because the controller's principal-to-Appraiser identity and method authorization have not been verified |
| Appraiser reviews/performance | Prior page attempted review and commission queries from one “performance” route                                                                           | Replaced in routing with a backward-compatible redirect to the commission page; avoid duplicate/unguarded metric queries                              |
| Seller appraisal management   | No seller appraisal service/pages found in the current frontend                                                                                           | Not implemented; request creation, seller list/detail and selection need exact DTOs and verified API permissions                                      |
| Admin management              | No Admin appraisal/commission pages in this User Frontend                                                                                                 | Belongs to the separate Admin Frontend per current project handoff; no routes added here                                                              |

## Changes made

- Added an `APPRAISER` role guard around Appraiser workspace routes. The profile route remains available to authenticated users so a user without an Appraiser profile can reach the existing registration form.
- Appraiser navigation now shows only the profile entry to a non-Appraiser and includes a dedicated commission entry to an Appraiser. The global “Become an appraiser” link now opens the profile registration page.
- Added `/appraiser/commissions`; kept `/appraiser/performance` as a legacy redirect. Commission values remain unavailable until the backend access contract is verified; no fake totals or payout actions were introduced.
- Removed the UI's hardcoded maximum of three rejected reports. The source contract does not establish that limit; the form now allows resubmission after a rejected report and still blocks a duplicate `SUBMITTED` report or an assignment outside `IN_PROGRESS`.
- Added route regression coverage for regular-user blocking and the separate unavailable commission page, plus report eligibility tests.

## Known contract and security blockers

- Doc 14 keeps Appraiser, Appraisal, and Commission at `NOT_STARTED` pending HTTP/security checks. Earlier EC2 probes received no HTTP response; this task did not call the deployed API or perform mutations.
- Source notes report that application submission and some appraisal endpoints lack role annotations; Frontend role guards are only UX and do not repair Backend authorization. Verify USER-versus-APPRAISER and same-owner/foreign-resource access at Backend before release.
- Commission detail queries by `commissionId` and `appraiserId`; the controller derives its identifier from `Authentication.getName()`. Confirm that principal and Appraiser IDs share a domain and enforce Appraiser-only access before enabling the service in the UI.
- Appraiser reviews, dashboard metrics, Seller Appraisal creation/selection, PDF/file evidence, report revision limit, and payout/reconciliation are not fully contract-verified. They remain unavailable or unimplemented rather than being inferred.
- `AppraisalConversationService` has a placeholder conversation ID per the handoff. No appraisal chat link was added.

## Verification

- Focused tests: **6 passed** for route access, `RequireRole`, and report eligibility. Full suite: **545 passed / 1 failed**; the failure is the existing profile edit assertion in `routes.test.jsx` expecting the updated name in a `<dd>`.
- `npm run lint`: **PASS**, one pre-existing React Hook Form compiler warning in `ProductCreateForm.jsx`. `npm run build`: **PASS**, with the existing large-chunk warning. `npm run format:check`: **PASS**. `git diff --check`: **PASS**. Prettier write was restricted to files changed in this task to avoid reformatting the already-dirty shared tree.
- Real Backend, authorization, responsive browser, and end-to-end Seller/Appraiser/Admin flows were **NOT TESTED**. The focused UI tests use the local test harness and are not backend integration evidence.
- The known profile edit failure is outside this task and remains to be investigated separately. Do not treat it as caused by these changes without isolating it.
