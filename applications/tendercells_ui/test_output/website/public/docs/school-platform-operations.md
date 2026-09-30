<!-- Generated from docs/SCHOOL_PLATFORM_OPERATIONS.md by website/scripts/sync-docs.mjs - edit the source, then run npm run sync:docs. -->

# School Platform Operations

This runbook covers the production services implemented for district identity, roster authorization, organization billing records, and authenticated remote camera sessions.

## Implemented services

- `getSchoolLoginOptions`: resolves a school code to enabled public Identity Platform tenant/provider IDs. It never returns provider secrets.
- `configureSchoolOrganization`: platform-admin bootstrap for district name, login code, approved domains, providers, tenant IDs, and the initial district administrator.
- `syncSchoolRoster`: district/school-admin normalized roster batches for Clever, ClassLink, Microsoft, Google, or CSV sources.
- `claimSchoolMembership`: matches the signed-in identity to an active roster record, writes membership, and issues `organizationId`, `schoolId`, `schoolRole`, and `classIds` custom claims.
- `createPurchaseOrder` and `createOrganizationInvoice`: server-authoritative organization billing records. They do not collect card details.
- `createCameraRelaySession` and `cameraRelaySignal`: owner-authorized five-minute WebRTC signaling sessions with hashed bearer tokens and ephemeral TURN credentials.

Firestore denies browser writes to organizations, rosters, invoices, audit records, and relay sessions. School device reads use organization and class claims. Administrators must refresh their Firebase ID token after claims change.

## Identity provider activation

School buttons appear only after a platform administrator configures an organization with an enabled provider and Identity Platform tenant. For each district:

1. Obtain written district approval and the provider agreement.
2. Upgrade the Firebase project to Identity Platform and create a tenant for the district.
3. Configure one or more providers inside that tenant:
   - Google Workspace: `google.com`, with district domain enforcement in the tenant/provider policy.
   - Microsoft Education: the district's Microsoft/Entra OIDC provider ID and tenant restrictions.
   - Clever: an approved Clever OAuth/OIDC application and exact callback/redirect URI.
   - ClassLink: an approved OIDC or SAML application and exact callback/ACS URI.
   - District SAML: exchanged metadata, signing certificate, entity ID, ACS URI, and rotation contacts.
4. Add `https://tendercells.com/__/auth/handler` to every provider's allowed redirect or ACS configuration.
5. Bootstrap the organization with `configureSchoolOrganization`. Provider IDs and Firebase tenant IDs are public configuration; client secrets stay in Identity Platform or the provider's secret store.
6. Import a small teacher-only roster batch, test role claims, then add students only after privacy and retention approval.

Do not enable a provider merely because a button renders. Acceptance requires login from the provider portal, login from TenderCells, logout, revoked-user denial, tenant isolation, and role-rule tests.

## Roles

| Role | Intended access |
|---|---|
| District admin | District provider setup, roster and organization billing |
| School admin | School roster, classes, assigned devices, purchase orders and invoices |
| Teacher | Assigned classes and devices; supervised schedules and observations |
| Student | Only class-assigned devices and work; no billing, roster administration, firmware erase, Wi-Fi credentials, or unrestricted motion |

## Billing

Purchase orders and invoices are records, not a payment processor. Card/ACH collection requires a PCI-compliant provider such as Stripe Checkout or a district-approved invoicing system. Never place card or bank data in Firestore.

The platform administrator receives a submitted PO, validates the external PO number and quote, and creates the invoice. School admins can read their organization's records; students and teachers cannot.

## Camera relay

Set these GitHub Actions secrets before remote camera sessions can be issued:

- `TURN_URLS`: comma-separated `turn:`/`turns:` URLs for the managed coturn or TURN service.
- `TURN_SHARED_SECRET`: coturn REST-auth shared secret.

The backend derives a five-minute TURN username/password and never returns the shared secret. WebRTC encrypts media in transit; the HTTPS function relays signaling only. The camera gateway must support WebRTC and poll/post signaling with the session bearer token. A stock ESP32 MJPEG endpoint cannot become remotely secure by inserting its private HTTP URL into the website; use a local gateway to convert MJPEG to WebRTC or firmware with native WebRTC support.

Before production use, validate concurrent-viewer limits, TURN egress cost, session revocation, device ownership changes, audit retention, recording policy, and student privacy.

## Remaining external gates

Code cannot supply district approval, provider client credentials, SAML certificates, Identity Platform tenant creation, roster-sharing authorization, a billing merchant account, or TURN infrastructure. Until each item is configured and acceptance-tested, its provider or relay remains unavailable and reports that state explicitly.
