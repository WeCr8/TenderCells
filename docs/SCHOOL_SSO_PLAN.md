# School & district accounts (SSO) — plan

**Status: backend and UI implemented; providers require district activation.** The website
account page accepts a school code, discovers enabled providers from a server-authoritative
organization record, sets the Identity Platform tenant, and starts Firebase OIDC/SAML sign-in.
Providers do not appear until their district tenant and provider configuration are approved.
See [School Platform Operations](SCHOOL_PLATFORM_OPERATIONS.md).

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
