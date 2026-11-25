# Upload File E2E Integration Verification

Date: 2026-11-25

## Environment

| Item                                    | Observed                                                                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend target                          | `http://13.126.191.203:8080` (from the local dev proxy configuration)                                                                         |
| Frontend origin requested for preflight | `http://localhost:5173`                                                                                                                       |
| Test account / role                     | None provided or discoverable in the checked project context; no credentials were read or used                                                |
| AWS/S3 access                           | No AWS console/CLI credentials or independent S3 access were provided; S3 is only reachable through a successful Backend presign response     |
| Safety                                  | No authenticated requests, presign POST, file upload, product/profile mutation, or delete was issued. The probes below were GET/OPTIONS only. |

## Runtime probes actually sent

All requests targeted the configured EC2 address. Each ended with the local HTTP client result `NO_HTTP_RESPONSE: UnknownError`. No HTTP status, response headers, or body were received. This establishes that this runner could not verify the deployed runtime; it does not establish whether the Backend process itself is down.

| Request                               | Request details                                                                                                            | Actual response                   | Result  |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------- |
| `GET /actuator/health`                | Direct to EC2, 8 second timeout                                                                                            | No HTTP response (`UnknownError`) | BLOCKED |
| `GET /api/v1/categories`              | Direct to EC2, 8 second timeout                                                                                            | No HTTP response (`UnknownError`) | BLOCKED |
| `OPTIONS /api/v1/files/presigned-url` | `Origin: http://localhost:5173`; requested method `POST`; requested headers `authorization,content-type`; 8 second timeout | No HTTP response (`UnknownError`) | BLOCKED |

No presign request was sent because it requires a test identity and can create a pending `StoredFile` record. No PUT, confirm, download, or delete request could be constructed without a real presign result and test account.

## Test cases

“Expected” describes the behavior to verify in a provisioned test environment. “Actual” reports what was observed in this run; code inspection or mocks are not counted as deployed E2E evidence.

| Test case                                        | Expected                                                                 | Actual                                                                                                         | Status  |
| ------------------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------- |
| Avatar: upload PNG                               | Presign, S3 PUT, confirm `AVAILABLE`, save file ID, avatar renders       | Not run; no test account and runtime gave no HTTP response                                                     | BLOCKED |
| Avatar: upload JPEG                              | Same as PNG                                                              | Not run; no test account and runtime gave no HTTP response                                                     | BLOCKED |
| Avatar: replace avatar                           | New file becomes current; old-file lifecycle is verified                 | Not run; no test account; replacement can mutate profile                                                       | BLOCKED |
| Avatar: remove avatar                            | Profile removal and stored-file lifecycle are verified                   | Not run; no test account; removal contract not runtime-verified                                                | BLOCKED |
| Avatar: reject video                             | Backend rejects it; UI does not save it                                  | No authenticated request; local code/unit behavior is not deployed evidence                                    | BLOCKED |
| Avatar: reject PDF                               | Backend rejects it; UI does not save it                                  | No authenticated request; local code/unit behavior is not deployed evidence                                    | BLOCKED |
| Product: upload image and confirm                | S3 PUT succeeds; confirm returns `AVAILABLE`                             | Not run; no test seller account and no presign response                                                        | BLOCKED |
| Product: upload video and confirm                | Supported product purpose is accepted and confirms `AVAILABLE`           | Not run; no test seller account and no presign response                                                        | BLOCKED |
| Product: create with StoredFile IDs              | Product persists the IDs and media renders                               | Not run; requires test seller/store and successful uploaded file                                               | BLOCKED |
| Product: view and render media                   | Authorized/public product response returns usable media URLs             | Not run; no runtime response                                                                                   | BLOCKED |
| Product: update media                            | New IDs persist; version/ownership rules hold                            | Not run; would mutate product data                                                                             | BLOCKED |
| Product: remove media                            | Empty/reduced media list persists; file lifecycle is understood          | Not run; would mutate product data                                                                             | BLOCKED |
| Product: ownership                               | Foreign file IDs are rejected                                            | Not run; requires two isolated test users and test product                                                     | BLOCKED |
| Appraisal: upload evidence                       | Correct purpose is accepted and evidence becomes `AVAILABLE`             | Not run; no test accounts, Backend contract/runtime not verified                                               | BLOCKED |
| Appraisal: submit and appraiser views evidence   | Request/report DTO linkage and role ownership work                       | Not run; requires test seller/appraiser fixtures and mutations                                                 | BLOCKED |
| Appraisal: report attachment                     | Supported attachment purpose works, if supported                         | Not run; support and DTO are unverified                                                                        | BLOCKED |
| Dispute: upload and create with evidence         | Evidence links persist and render for authorized admin/user              | Not run; dispute is `NOT_STARTED` in the integration matrix; no verified StoredFile DTO                        | BLOCKED |
| Security: User A reads/downloads User B file     | Backend denies access                                                    | Not run; requires two test identities and file fixture                                                         | BLOCKED |
| Security: User A deletes User B file             | Backend denies access and leaves file intact                             | Not run; destructive cross-user test requires disposable fixtures                                              | BLOCKED |
| Security: unauthorized purpose                   | Backend rejects purpose/file-type mismatch                               | Not run; no test identity and no HTTP response                                                                 | BLOCKED |
| Lifecycle: PENDING/DELETED file linked to module | Backend rejects non-`AVAILABLE` files                                    | Not run; requires controlled lifecycle fixtures                                                                | BLOCKED |
| Failure: Backend unavailable                     | UI displays a safe error and never reports success                       | No-HTTP runtime condition observed only with unauthenticated GET/OPTIONS; upload UI failure path not exercised | BLOCKED |
| Failure: S3 PUT failure                          | Confirm is not called; UI reports upload failure                         | Not run; no presigned URL                                                                                      | BLOCKED |
| Failure: expired presigned URL                   | PUT fails; no false confirmation/success                                 | Not run; no presigned URL                                                                                      | BLOCKED |
| Failure: confirm failure / duplicate confirm     | No false success; duplicate behavior is idempotent or documented         | Not run; requires uploaded test object and runtime                                                             | BLOCKED |
| Failure: network interruption / retry            | State remains accurate and retry does not create uncontrolled duplicates | Not run; deployed upload UI and idempotency not exercised                                                      | BLOCKED |

## Bugs, fixes, and retest

| Item                                  | Finding                                                                                                                             | Fix                                      | Retest                                                                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Deployed API reachability             | This runner received no HTTP response for health, categories, or presign CORS preflight.                                            | No infrastructure change attempted.      | BLOCKED; retry from an environment with network access to EC2 and obtain a Backend health response.                |
| Test identity and disposable fixtures | No account, role matrix, or resettable data set was supplied.                                                                       | No real-user data was touched.           | BLOCKED; provision disposable USER, seller/store, APPRAISER, and ADMIN identities plus cleanup/reset instructions. |
| S3 behavior                           | No real presigned URL was issued, so signed headers, CORS, PUT, object metadata, and URL expiry could not be observed.              | No AWS config was changed.               | BLOCKED; retest only after authenticated presign works in the test environment.                                    |
| Module linkage                        | Appraisal upload contract is unverified; dispute is marked `NOT_STARTED` and currently has no verified StoredFile linkage contract. | No guessed DTO or API mutation was sent. | BLOCKED; Backend must provide and deploy the linkage contract before those flows can be tested.                    |

No bug was confirmed against the deployed service, so no deployed-service fix or retest can be claimed. The earlier local frontend unit/mock tests are separate evidence and are not a real AWS integration pass.

## Conclusion

The upload flow has **not been verified end-to-end**. Every account-dependent test is **BLOCKED**, not PASS. The only actual requests in this run were safe unauthenticated GET/OPTIONS probes, and the runner received no HTTP response. No AWS/S3 request, authenticated API request, or destructive operation was made.

To resume safely, provide a reachable non-production Backend endpoint, test accounts with the required roles, disposable product/appraisal/dispute fixtures, and a cleanup plan. Backend should confirm the deployed build and the Appraisal/Dispute file-link DTOs. Then run tests in order: health/CORS → presign → S3 PUT → confirm → view/download → module linkage → ownership/lifecycle negatives → deletion of only newly created disposable test records.
