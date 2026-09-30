# School & district accounts (SSO) — plan

## Start now: what gets a school signed up

**Google Workspace for Education already works.** "Continue with Google" uses Firebase's
Google provider, so no SSO backend is needed to sign in. The following steps are still needed.

1. **Google Cloud console → OAuth consent screen (brand).**
   - App name: Tender Cells. Add the logo, the support email, `tendercells.com` as an authorized domain, and the privacy and terms URLs.
   - Publish the app to *In production*.
   - We only request `openid email profile`, which are non-sensitive scopes, so Google app verification is **not** required.
   - Brand verification is quick and makes the logo show.
2. **Give the school's IT admin the OAuth client ID.**
   - Find it in Google Cloud console → Credentials → "Web client (auto created by Google Service)".
   - Set it as the repo variable `GOOGLE_OAUTH_CLIENT_ID` so `/schools` shows it.
3. **School IT admin marks Tender Cells as Trusted.**
   - In the Admin console: Security → Access and data control → API controls → Manage Third-Party App Access → Add app → OAuth App Name or Client ID.
   - Choose the org units → **Trusted**.
   - **Why this is required:** accounts designated as under 18 are blocked from any third-party app the admin has not configured, even for plain Google sign-in.
4. **Later: Google Classroom rosters.**
   - The `classroom.rosters.readonly` / `classroom.courses.readonly` scopes are sensitive.
   - They need Google OAuth app verification (a demo video and a privacy policy review).
   - Start that when roster sync is built.

**Microsoft 365 can be turned on without Identity Platform.** Firebase's built-in Microsoft
provider handles it.

1. **Register the app.**
   - Microsoft Entra admin center → App registrations → New registration.
   - Choose **Accounts in any organizational directory (multi-tenant)**.
   - Redirect URI: `https://<project>.firebaseapp.com/__/auth/handler`.
2. **Enable it in Firebase.**
   - Create a client secret.
   - In the Firebase console → Authentication → Sign-in method → Microsoft, enable the provider with the client ID and secret.
3. **Turn on the button.**
   - Set repo variables `SSO_MICROSOFT=1` and `MICROSOFT_CLIENT_ID=<application id>`.
   - The sign-in page then shows "Continue with Microsoft 365" (tenant `organizations`: school and work accounts only).
   - `/schools` shows the admin-consent link each school's admin accepts once.

**Clever and ClassLink need Identity Platform (OIDC/SAML).** Start this when a district asks
for them; the steps are below.

**School pilot sign-ups:**
- Pilot requests arrive in Firestore `schoolInquiries` from `tendercells.com/schools`.
- An account whose email domain matches an org's `domains` gets a join request (`orgs/{id}/joinRequests/{uid}`) for that org's staff to approve.
- No account is granted access automatically.

See `docs/SCHOOL_ACCOUNTS.md` for how the school owns properties and products.

---


**Status: Google works now; Microsoft is ready to enable; the rest is prepared.** The website account page (`tendercells.com/account`) shows
school sign-in, account types and classroom features with **Coming soon** labels. No SSO
provider is connected, and `startSsoSignIn()` in `website/src/lib/sso.ts` always refuses.
The OS login shows a disabled "School or district sign-in" button that points to the website
account page, which is where all account functions live.

## What users will get

| Account type | Signs in with | Sees |
|---|---|---|
| Personal / homestead (live today) | Google or email | Their yard, devices, flocks, schedules |
| Farm or business | Google, email, Microsoft | Several properties, staff logins |
| Educator | School SSO | Classes, roster, lesson progress, shared lab robots |
| Student | School SSO or a class code | Assigned lessons and class devices only |
| School admin / District admin | School SSO | Rosters, device access, data settings, SSO + roster sync |

## Providers (prepared in `SSO_PROVIDERS`)

| Provider | Protocol | Identity Platform provider | Roster source |
|---|---|---|---|
| Google Workspace for Education | OIDC | `google.com` with the `hd` domain hint | Google Classroom API |
| Microsoft 365 Education | OIDC | `microsoft.com` with a per-district tenant | Microsoft School Data Sync |
| Clever | OIDC | `oidc.clever` | Clever Secure Sync |
| ClassLink | OIDC / SAML | `oidc.classlink` / `saml.classlink` | ClassLink Roster Server (OneRoster) |
| Other district IdP | SAML | `saml.<district>` | OneRoster CSV |

## Backend steps to go live

1. Upgrade Firebase Auth to **Identity Platform**, which adds SAML/OIDC providers and multi-tenancy.
2. Create one **tenant per district** and register the district's identity provider on it. Set `auth.tenantId` before sign-in.
3. Add a **blocking function** (`beforeUserSignedIn`) that looks the user up in the roster and sets custom claims: `{ accountType, role, schoolId, districtId, classIds }`.
4. Build **roster sync** jobs (Clever, ClassLink/OneRoster, Classroom, SDS) that write to `/schools/{schoolId}/classes/{classId}` and `/schools/{schoolId}/members/{uid}`.
5. Update **Firestore rules** to use those claims. Teachers read their classes; students read only their own work and their class's devices. Update the rules in the same change (CLAUDE.md rule).
6. **Student privacy**:
   - Collect minimal data (no student email when the IdP gives a pseudonymous id).
   - Keep parent/guardian consent records for under-13s (COPPA).
   - Sign data agreements with schools (FERPA and state student-privacy laws).
   - Delete student data on roster removal.
7. For each provider, set `status: 'available'`, implement `startSsoSignIn()`, and remove its "Coming soon" label.
