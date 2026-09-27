// sso.ts - school / district single sign-on and account types (PREPARED, NOT LIVE).
//
// Everything here renders as "Coming soon". Nothing starts a sign-in yet: the SSO
// backend is not set up. What going live needs (see docs/SCHOOL_SSO_PLAN.md):
//   1. Upgrade Firebase Auth to Identity Platform (multi-tenant, SAML + OIDC providers).
//   2. One tenant per school district; register each district's IdP on its tenant.
//   3. A blocking Cloud Function (beforeSignIn) that sets custom claims:
//      { accountType, schoolId, districtId, classIds, role } from the roster.
//   4. Roster sync (Clever Secure Sync, ClassLink OneRoster, Google Classroom,
//      Microsoft School Data Sync) into Firestore /schools/{id}/classes, /students.
//   5. Firestore rules keyed on those claims; student data minimised (FERPA / COPPA).
// Then flip `status` to 'available' per provider and implement startSsoSignIn().

export type SsoStatus = 'coming-soon' | 'available';

export interface SsoProvider {
  id: string;
  label: string;
  /** Who uses it. */
  audience: string;
  /** Firebase / Identity Platform provider id to register (not configured yet). */
  firebaseProviderId: string;
  protocol: 'OAuth / OIDC' | 'SAML' | 'OIDC or SAML';
  /** How classes and students would sync once connected. */
  rosterSource: string;
  status: SsoStatus;
}

export const SSO_PROVIDERS: SsoProvider[] = [
  {
    id: 'google-workspace-edu', label: 'Google Workspace for Education', audience: 'Schools on Google (Chromebooks, Classroom)',
    firebaseProviderId: 'google.com (hd = school domain)', protocol: 'OAuth / OIDC', rosterSource: 'Google Classroom API', status: 'coming-soon',
  },
  {
    id: 'microsoft-edu', label: 'Microsoft 365 Education', audience: 'Schools on Microsoft Entra ID / Teams',
    firebaseProviderId: 'microsoft.com (tenant = district)', protocol: 'OAuth / OIDC', rosterSource: 'Microsoft School Data Sync', status: 'coming-soon',
  },
  {
    id: 'clever', label: 'Clever', audience: 'K-12 districts using the Clever portal',
    firebaseProviderId: 'oidc.clever', protocol: 'OAuth / OIDC', rosterSource: 'Clever Secure Sync', status: 'coming-soon',
  },
  {
    id: 'classlink', label: 'ClassLink', audience: 'K-12 districts using ClassLink LaunchPad',
    firebaseProviderId: 'oidc.classlink / saml.classlink', protocol: 'OIDC or SAML', rosterSource: 'ClassLink Roster Server (OneRoster)', status: 'coming-soon',
  },
  {
    id: 'district-saml', label: 'Other district sign-in (SAML)', audience: 'Colleges, FFA / 4-H programs, custom IdPs',
    firebaseProviderId: 'saml.<district>', protocol: 'SAML', rosterSource: 'OneRoster CSV upload', status: 'coming-soon',
  },
];

export type AccountType = 'personal' | 'farm' | 'educator' | 'student' | 'school-admin' | 'district-admin';

export interface AccountTypeInfo {
  id: AccountType;
  label: string;
  description: string;
  status: SsoStatus;
}

/** Account types the website account will house. Personal is what exists today. */
export const ACCOUNT_TYPES: AccountTypeInfo[] = [
  { id: 'personal', label: 'Personal / homestead', description: 'Your yard, devices, flocks and schedules.', status: 'available' },
  { id: 'farm', label: 'Farm or business', description: 'Several properties, staff logins and shared devices.', status: 'coming-soon' },
  { id: 'educator', label: 'Educator', description: 'Classes, student roster, lesson progress and shared lab robots.', status: 'coming-soon' },
  { id: 'student', label: 'Student', description: 'Signs in through the school; sees assigned lessons and class devices only.', status: 'coming-soon' },
  { id: 'school-admin', label: 'School admin', description: 'Teachers, rosters, device access and data settings for a school.', status: 'coming-soon' },
  { id: 'district-admin', label: 'District admin', description: 'SSO connection, roster sync and policies across schools.', status: 'coming-soon' },
];

/** School features the account page lists as coming soon. */
export const SCHOOL_FEATURES: Array<{ id: string; label: string; detail: string }> = [
  { id: 'connect-school', label: 'Connect your school (SSO)', detail: 'Sign in with your school or district account.' },
  { id: 'roster', label: 'Student roster', detail: 'Import classes and students from Clever, ClassLink, Google Classroom or Microsoft.' },
  { id: 'access', label: 'Class access & devices', detail: 'Choose which robots, gardens and coops each class can see or run.' },
  { id: 'curriculum', label: 'Curriculum & progress', detail: 'Assign lessons, track completion and export grades.' },
  { id: 'consent', label: 'Parent / guardian consent', detail: 'Consent records for students under 13 (COPPA) and school data agreements (FERPA).' },
];

/**
 * Start a school sign-in. Not live yet: the SSO backend (Identity Platform tenants,
 * providers, claims) is still being set up, so this always refuses.
 *
 * @throws Error explaining that school sign-in is coming soon
 */
export function startSsoSignIn(provider: SsoProvider): never {
  throw new Error(`${provider.label} sign-in is coming soon.`);
}
