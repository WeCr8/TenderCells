# DREAM Academy School Pilot

This runbook prepares a small, teacher-supervised TenderCells robotics and mini-farm pilot for DREAM Academy in Lakeside, California. It does not authorize a deployment or represent the school or Lakeside Union School District.

Public context:

- DREAM Academy is a Lakeside Union School District K-8 public alternative school: https://sd.cde.ca.gov/schooldirectory/details?cdscode=37681896107742
- Its program emphasizes Design, Research, Engineering, Agriculture, and Mechanics: https://www.lsusd.net/dream-academy/
- Clever SSO uses OAuth 2.0 authorization-code flow and may use OIDC: https://dev.clever.com/docs/getting-started-with-clever-sso
- Firebase Google sign-in and production redirect requirements: https://firebase.google.com/docs/auth/web/google-signin and https://firebase.google.com/docs/auth/web/redirect-best-practices

## Recommended first pilot

Start with teacher accounts and a small number of shared, supervised devices. Do not import a student roster for the first hardware validation.

1. Single ESP32-S3 Sense camera node for a mini-farm enclosure.
2. ESP32-C3/S3 watering node with water-level sensing only; add a low-voltage pump later with an adult and a properly rated driver.
3. ESP32-C3/S3 feeding node with hopper-level sensing only; add weighing or motor control after bench validation.
4. Optional low-voltage RC rover with student mode, default-stop motors, adult-controlled power, and a physical disconnect.
5. Account-level animal roster using non-sensitive animal names, optional photos, and teacher-reviewed camera observations.

## Roles

| Role | Initial access |
|---|---|
| District/school administrator | Approve identity provider, privacy terms, domains, and pilot scope |
| Teacher/club lead | Own workspace, devices, schedules, animal records, and student sessions |
| Student | View assigned devices, collect observations, run approved non-moving tasks |
| Parent/guardian | No account required for the initial classroom pilot |

Motor, pump, heater, flight, firmware erase, Wi-Fi credential, account administration, and data-export actions require an adult role. Student mode must be the default.

## Google Workspace setup

Google sign-in already uses Firebase Authentication. Before a school pilot:

1. Confirm `tendercells.com` is a Firebase Hosting custom domain for the production Firebase project.
2. The production deployment sets the Firebase web `authDomain` to `tendercells.com`; keep the deploy guard enabled so redirect sign-in remains first-party.
3. Add `tendercells.com` to Firebase Authentication authorized domains.
4. Add `https://tendercells.com/__/auth/handler` as the provider redirect URI when required.
5. Enable Google as an Authentication provider and configure the support email and consent branding.
6. Ask district IT whether access must be limited to the `lsusd.net` Workspace domain. Client-side `hd` hints are not authorization; enforce approved domains or tenant membership on the server/custom claims.
7. Test popup and redirect fallback on managed Chromebooks, including blocked popups and restricted third-party storage.

Do not commit Firebase private keys, service-account files, district admin contacts, or test student credentials.

## Clever preparation

Clever is not a drop-in Firebase web provider. Use its OAuth 2.0 authorization-code flow, optionally with OIDC:

1. Create a TenderCells Clever developer application and complete the applicable Clever agreement.
2. Register a production callback such as `https://tendercells.com/api/auth/clever/callback` and a separate localhost callback for development.
3. Start with identity-only scopes. Do not request district roster or Data API access until the district approves a documented need.
4. Exchange the authorization code on a trusted server or Cloud Function. Never put the Clever client secret in the browser.
5. Validate `state`, PKCE where supported, issuer, audience, nonce, token expiry, and redirect URI.
6. Resolve the approved school/district and role server-side, then mint a Firebase custom token with minimal claims such as `organizationId`, `schoolId`, and `role`.
7. Keep Clever identifiers in owner-protected account membership documents. Do not copy unnecessary student profile or roster fields.
8. Test launch from both the TenderCells login button and the Clever Portal sandbox before requesting district launch.

## Privacy and safety checklist

- Obtain district approval and identify the responsible teacher and technical contact.
- Decide whether student accounts are needed; prefer teacher-owned shared stations first.
- Publish retention periods for animal photos, video observations, telemetry, and student work.
- Do not continuously record audio or video by default.
- Keep local camera streams on the school LAN until an authenticated HTTPS relay is approved.
- Require visible recording indicators and teacher control over saved media.
- Separate animal-recognition reference images from student images; avoid capturing students in training sets.
- Provide deletion/export procedures and an incident contact.
- Review COPPA, FERPA, California student privacy requirements, district acceptable-use policy, and vendor agreements with the district. This repository does not make that legal determination.

## Acceptance test

1. Teacher signs in with a managed Google account on a Chromebook.
2. Unauthorized domains cannot enter the school workspace.
3. Student mode cannot enable motors, pumps, firmware erase, recording, or administrative settings.
4. Camera works locally, clearly says `Local only`, and reconnects after tab switching.
5. Animal records and permitted photos sync between teacher desktop and tablet.
6. Unsupported sensors say `Not installed`; silent sensors say `Not reporting`.
7. Demo data is absent unless Demo Mode was explicitly loaded.
8. Teacher can remove the pilot workspace and all associated cloud records.

## Information needed from school IT

- Approved identity path: Google Workspace, Clever, or both.
- Approved email domain and whether organizational-unit restrictions apply.
- Clever district/application approval contact and required scopes.
- Managed Chromebook browser restrictions and allowlisted domains.
- Network policy for `.local`, private HTTP camera streams, WebSerial, MQTT/WebSocket, and HTTPS relay traffic.
- Required privacy agreement, data-retention period, accessibility review, and incident process.

Use [School IT Network and Device Enrollment](SCHOOL_IT_NETWORK_AND_DEVICE_ENROLLMENT.md) for the credential-free student workflow, VLAN/firewall intake, billing ownership, inventory, and device retirement checklist.
