# Frontend file upload and media contract audit

Date: 2026-11-25

## Scope and architecture

The frontend is a Vite/React JavaScript app. Product forms call `src/services/files/fileUploadService.js` through the shared `MediaUploadButton`; product APIs live in `src/services/products/productService.js`. The shared Axios client adds the app Bearer token for backend API calls. S3 transfer uses browser `fetch` directly, so the API interceptor does not add authorization to the presigned URL request.

Create product media is held as `{ fileId, fileName, previewUrl }` in local component state. The service only returns a usable `fileId` after the upload and confirm steps succeed. Product edit uses `imageFileIds` plus `version`; the list UI supports removing and reordering managed images. Public product cards and detail galleries use `media[].viewUrl` first, with legacy `images[]` as fallback. Failed image loads trigger a product query refetch.

## Actual API flow and mapping

1. `POST /api/v1/files/presigned-url` receives `{ filename, contentType, fileSize, purpose }`. Its body is consumed directly from `response.data`; there is no ApiResponse unwrap.
2. The browser PUTs the raw `File` body to `uploadUrl` with `Content-Type` equal to `file.type`. This request uses `fetch`, without JSON, FormData, or the backend Axios client.
3. `POST /api/v1/files/{fileId}/confirm` is consumed as a direct DTO. The client now requires `status === "AVAILABLE"` before returning the `fileId` to form state.
4. Product create/update uses the Axios client and `unwrap(response)` because product APIs return `ApiResponse<T>`. Create sends `imageFileIds`, never temporary URLs. Update sends `imageFileIds` only when media was changed; an empty array explicitly removes all managed images. Unchanged media is omitted.
5. Product results are read from the unwrapped response. Rendering prefers `media[].viewUrl`; the card/detail image error callback refetches the product query for a fresh view URL.

## Findings and fixes

| Classification    | Finding before fix                                                                                                      | Resolution                                                                                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CONTRACT MISMATCH | `fileUploadService.js` allowed images up to 10 MiB; backend permits 5 MiB.                                              | Aligned frontend limit to 5 MiB and corrected Vietnamese/English hints. Video limit remains 50 MiB.                                                                                           |
| CONTRACT MISMATCH | Client did not check filename extension against MIME type.                                                              | Added JPEG/JPG, PNG, WebP, MP4 and WebM extension-to-MIME checks before requesting a presigned URL.                                                                                           |
| BUG               | Confirm with missing status was treated as success.                                                                     | Confirm now must explicitly return `AVAILABLE`; failure does not return a usable file ID.                                                                                                     |
| BUG               | Product edit sent legacy `images` on every update, causing media replacement and using URL strings instead of file IDs. | Edit form manages ordered IDs; unchanged media is omitted, changed media sends the complete ordered `imageFileIds`, and remove-all sends `[]`. Legacy images are never converted to file IDs. |
| UX ISSUE          | Product edit had no managed image upload/remove/reorder controls.                                                       | Added upload, removal and up/down ordering controls. Legacy images without IDs are surfaced with a warning that a changed list replaces the complete media list.                              |
| BUG               | Product create could be submitted while an upload was still running.                                                    | Submit is disabled while upload/confirm is in progress. Only confirmed files enter form state.                                                                                                |
| CONTRACT MISMATCH | Edit validation rejected long temporary URLs and constrained image URL strings to 500 characters.                       | Removed URL validation from product edit; the form no longer sends view URLs as product media data.                                                                                           |
| UX ISSUE          | Media rendering ignored legacy `images` when media was empty.                                                           | Added a fallback for legacy-only products, while preferring `media[].viewUrl` when available.                                                                                                 |
| BUG               | Update service/form always included media fields even when unchanged.                                                   | Update request construction now permits media omission and preserves `version` for optimistic locking.                                                                                        |

No product path uses `media[].id` as an upload file ID or calls a guessed `/files/{id}/view` route. The direct upload and backend product response wrapper differences are preserved.

## Files changed for this audit

- `src/services/files/fileUploadService.js`: frontend validation and strict confirm state.
- `src/features/disputes/components/OrderDisputePanel.jsx`: removed unsupported file upload from the URL-only dispute form.
- `src/features/products/components/ProductCreateForm.jsx`: create submit gating; the existing upload component callback only returns after confirm succeeds.
- `src/services/products/productService.js`, `src/features/products/hooks/useEditProductForm.js`, `src/features/products/schemas/editProductSchema.js`: update payload and validation semantics.
- `src/features/products/components/ProductEditForm.jsx`: ordered managed media editing.
- `src/features/products/utils/productMedia.js`: media URL priority and legacy fallback.
- `src/i18n/locales/{vi,en}/common.json`: upload limits and edit-media labels.
- Related tests: `src/services/files/fileUploadService.test.js`, `src/services/products/productService.test.js`, `src/features/products/schemas/editProductSchema.test.js`, `src/features/products/utils/productMedia.test.js`, and one product assertion in `src/app/router/routes.test.jsx`.

## Verification

- `npm run format`: completed. The repository had unrelated pre-existing staged and unstaged changes; inspect `git status` before staging or committing so those remain separate.
- `npm run lint`: passed with one existing React Hook Form `watch()` React Compiler warning in `ProductCreateForm.jsx`; no lint errors.
- `npm run build`: passed. Vite reported its existing large-chunk warning.
- Relevant focused tests: 4 files, 29 tests passed (file upload, product API, edit schema, product media mapping).
- `npm run test -- --reporter=dot`: 77 test files passed; 539 tests passed and one failed. The remaining failure is profile edit in `src/app/router/routes.test.jsx`: it expects the updated profile name inside a `<dd>`, but the rendered page did not contain it. This is outside upload/media scope and was not changed.
- Browser/DevTools and EC2/S3 integration were not exercised in this local environment.
- Follow-up verification: upload service tests passed (12/12); full `npm run lint` passed with the existing React Hook Form warning; `npm run build` passed with the existing large chunk warning; `npm run format:check` passed. Full suite: 540 passed, 2 unrelated failures (`routes.test.jsx` profile name assertion and `ChatFlow.test.jsx` waiting for “New message”). No TypeScript files or type-check script exist in `package.json`.

## Remaining risks and contract boundaries

- Browser CORS, actual S3 signed-header behavior, deployed URL expiration, backend error JSON, and EC2 deployment configuration require a manual integration check.
- A legacy product may have `images[]` URLs without corresponding `imageFileIds`. Leaving media untouched preserves that backend state by omitting media fields. If editing the media list, the user must upload every legacy image they want retained; the new backend managed-media flow cannot infer IDs from legacy URLs.
- If an image URL expires, rendering falls back and initiates a product refetch. No permanent asset URL is stored in localStorage or a database by this UI.
- Backend validation remains authoritative for file signatures, actual size, ownership, purpose, availability, and linked-file constraints.

## Browser DevTools manual check

1. Open the seller product create page and DevTools **Network**. Select one JPEG/PNG/WebP under 5 MiB.
2. Confirm a backend POST to `/api/v1/files/presigned-url` has filename, MIME, byte size and `PRODUCT_IMAGE`; inspect that its response is direct JSON with `fileId`, `uploadUrl`, and `expiresIn`.
3. Confirm the S3 request is PUT with the binary request body and matching `Content-Type`. It must not contain the backend Bearer token or JSON body. Verify S3 CORS allows the app origin, PUT, and this header.
4. Confirm backend POST `/api/v1/files/{fileId}/confirm` returns `AVAILABLE`. Try a failed PUT/confirm and verify no ID appears in the form and product submit cannot race an in-flight upload.
5. Create a product and inspect its JSON: it should contain ordered `imageFileIds`, with no presigned URL or legacy `images` field. Confirm the product response wrapper is unwrapped in app code and `media[].viewUrl` renders.
6. Edit once without touching media and verify request omits `images` and `imageFileIds`; edit again to add, reorder, remove one, and remove all. The last operation should send `imageFileIds: []`; every request must include current `version`.
7. Open product list/detail with an expired or invalid view URL and confirm a product refetch gets a fresh URL; verify empty `media` uses legacy `images` when present and a broken image shows the fallback.
8. Check backend 400/401/403/404/409/502 responses and network/CORS failures show an error and never produce a successful product submission with an unconfirmed file.

## Conclusion

The product create, edit, upload and render code is aligned with the supplied backend contract at source level. The upload service now rejects malformed/non-HTTPS presign and download URL responses and enforces the avatar image-only rule itself. The unverified dispute upload control was removed: dispute is `NOT_STARTED` in doc 14, its request contract stores `imageUrls`, and uploading a signed URL there would persist an expiring URL (and previously allowed videos in an image field). Manual HTTPS URL entry remains; StoredFile-based dispute evidence needs a verified backend DTO before it can be integrated safely. The undocumented `/files/{id}/view` helper was removed; the documented file API only includes `download-url`.

Automated contract-focused tests pass after the latest fixes. Browser/S3 CORS, deployed URL expiration, error behavior, and the actual Backend response DTOs still need manual verification against a reachable Backend.
