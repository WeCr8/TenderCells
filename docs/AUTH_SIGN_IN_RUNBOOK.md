# Sign-in runbook (Google, email, school, AI connector)

Written 2026-10-15 after "can't sign in with Google or the other options" on iPad.

## What breaks and why

| Symptom | Cause | Fix |
|---|---|---|
| Google sign-in on iPad/iPhone Safari (or a home-screen app) returns signed out, or nothing happens | The apps run on `tendercells.com`, but `authDomain` is `tender-cells.firebaseapp.com`. Safari 16.1+, Firefox 109+ and Chrome 115+ partition third-party storage, so a redirect sign-in can't finish cross-origin. The old code fell back to a redirect every time Safari blocked the popup. | Code (this branch): redirect is used only when it can finish, and a blocked popup now shows a clear message. Config: make the helper same-origin (steps below). |
| School/district code shows "INTERNAL"; school sign-in fails | Every Cloud Function that reads Firestore is denied by IAM (`getSchoolLoginOptions`, `claimSchoolMembership`, `confirmNewsletter`) | IAM grant below |
| Claude/ChatGPT "Connect Tender Cells" fails; `/oauth/*` returns 503 | The same IAM denial (`/oauth/health` returns `PERMISSION_DENIED (7)`) | IAM grant below |
| `www.tendercells.com` shows Cloudflare error 526 | Cloudflare (Full/strict) can't validate an origin certificate for `www` | Add `www.tendercells.com` as a Firebase Hosting custom domain (or redirect it in Cloudflare) |
| `chicken-tender-619sdla.web.app` is a blank page | That site serves the OS build, whose assets live under `/app/` | `firebase.json` now 301-redirects it to `https://tendercells.com/app/…` (needs `hosting:chicken-tender` deploy) |

Email/password sign-in works (verified live 2026-10-15). Only Email/Password and Google are enabled in Firebase Auth; Microsoft/Apple/GitHub are not configured and are not offered in the UI.

## Steps, in this order

1. **IAM (fixes school sign-in and the AI connector):**
   ```
   gcloud projects add-iam-policy-binding tender-cells \
     --member="serviceAccount:tender-cells@appspot.gserviceaccount.com" \
     --role="roles/datastore.user"
   ```
   The functions are 1st-gen (`firebase-functions` v1 API) with no custom service account, so they run as the App Engine default account. Verify with `curl https://tendercells.com/oauth/health` (expect `{"firestore":"ok"}`). Once this branch is deployed, also check `https://us-central1-tender-cells.cloudfunctions.net/health?deep=1`.
2. **Google OAuth client:** Google Cloud console → APIs & Services → Credentials → the OAuth 2.0 web client with ID `31544375751-4p8apf17uarc4sblahafi47nkpdrs793.apps.googleusercontent.com` (the one Firebase Google sign-in uses) → Authorized redirect URIs → add `https://tendercells.com/__/auth/handler`. Keep the existing `https://tender-cells.firebaseapp.com/__/auth/handler`. Authorized JavaScript origins: make sure `https://tendercells.com` is listed.
3. **GitHub repo variable:** `FIREBASE_SAME_ORIGIN_AUTH_HOSTS=tendercells.com` (Settings → Secrets and variables → Actions → Variables). Do this only after step 2. Until then, Google sign-in on that host would fail with `redirect_uri_mismatch`.
4. **Deploy:** push/merge to `main` (or run the Deploy workflow manually). It ships hosting, functions and rules together.
5. Optional: `firebase deploy --only hosting:chicken-tender --project tender-cells`, and fix the `www` custom domain.

## How the code decides (shared/auth/signInPlan.ts)

- `authDomain` becomes the page's host only when that host is listed in `VITE_FIREBASE_SAME_ORIGIN_AUTH_HOSTS`. Everything else keeps `tender-cells.firebaseapp.com`.
- Same-origin helper + iPad/iPhone or home-screen app → `signInWithRedirect`. Otherwise use the popup.
- Popup blocked → retry as a redirect only when the helper is same-origin. Otherwise tell the user how to allow pop-ups.
- A callable `functions/internal` error → "temporarily unavailable" instead of "INTERNAL".
