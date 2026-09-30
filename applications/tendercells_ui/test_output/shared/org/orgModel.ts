// orgModel.ts - schools, districts and farms as organizations that OWN properties and
// products; classes decide what students can see and do. Shared by the OS and website.
//
// Rules this encodes (docs/SCHOOL_ACCOUNTS.md):
//   * An organization (school, district, farm) owns its properties and products.
//     A district can own schools' shared assets; each school has its own.
//   * Students never get their own property. They use the org's properties/products
//     that their classes allow, with the capabilities their class grants.
//   * Teachers see their classes' assets; org admins / owners see everything in the org.
//   * The subscription plan caps properties, products, classes and seats.
//   * Firing a weeding laser is never a student capability (safety).
//
// Firestore layout (firestore.rules):
//   /orgs/{orgId}                            OrgDoc
//   /orgs/{orgId}/members/{uid}              MemberDoc (allowed* lists kept in sync by
//                                            the syncClassAccess Cloud Function)
//   /orgs/{orgId}/classes/{classId}          ClassDoc
//   /properties|products|devices/{id}        + optional orgId (org-owned)

export type OrgType = 'school' | 'district' | 'farm' | 'homestead';
export type Plan = 'free' | 'classroom' | 'school' | 'district';
export type Role = 'owner' | 'admin' | 'teacher' | 'student' | 'viewer';

export interface Capabilities {
  viewMap: boolean;
  viewCameras: boolean;
  runRoutines: boolean;      // feed, door, cleaning, arm routines (still confirm + safety-gated)
  weedAim: boolean;          // point the aiming dot
  weedBurn: boolean;         // fire the laser (never students)
  editLayout: boolean;
  manageDevices: boolean;    // register / claim products
}

export interface OrgDoc {
  id: string;
  name: string;
  type: OrgType;
  plan: Plan;
  /** Email domains that identify this org's accounts (e.g. "lincoln.k12.ca.us"). */
  domains?: string[];
  /** A school can belong to a district. */
  districtId?: string;
  ownerUid: string;
}

export interface ClassDoc {
  id: string;
  orgId: string;
  name: string;
  teacherUids: string[];
  studentUids: string[];
  propertyIds: string[];
  productIds: string[];
  capabilities: Partial<Capabilities>;
}

export interface MemberDoc {
  uid: string;
  orgId: string;
  role: Role;
  classIds: string[];
}

export const PLAN_LIMITS: Record<Plan, { properties: number; products: number; classes: number; seats: number; label: string }> = {
  free: { label: 'Free', properties: 1, products: 3, classes: 0, seats: 1 },
  classroom: { label: 'Classroom', properties: 1, products: 10, classes: 3, seats: 40 },
  school: { label: 'School', properties: 3, products: 40, classes: 30, seats: 600 },
  district: { label: 'District', properties: 50, products: 1000, classes: 1000, seats: 20000 },
};

/**
 * Cloud video / audio per plan (proposed - pricing is set in billing). Local live view on the
 * owner's network, AI events and telemetry are free on every plan; relaying media through
 * Tender Cells costs real bandwidth, so live cloud view and clip history are paid.
 */
export const CLOUD_FEED: Record<Plan, { liveHoursPerMonth: number; snapshotDays: number; clipDays: number }> = {
  free: { liveHoursPerMonth: 0, snapshotDays: 7, clipDays: 0 },
  classroom: { liveHoursPerMonth: 20, snapshotDays: 30, clipDays: 7 },
  school: { liveHoursPerMonth: 200, snapshotDays: 30, clipDays: 30 },
  district: { liveHoursPerMonth: 2000, snapshotDays: 90, clipDays: 30 },
};

const NONE: Capabilities = {
  viewMap: false, viewCameras: false, runRoutines: false, weedAim: false, weedBurn: false, editLayout: false, manageDevices: false,
};
const ALL: Capabilities = {
  viewMap: true, viewCameras: true, runRoutines: true, weedAim: true, weedBurn: true, editLayout: true, manageDevices: true,
};

/** What a role can do before class grants are applied. */
export const ROLE_BASE: Record<Role, Capabilities> = {
  owner: ALL,
  admin: ALL,
  teacher: { ...NONE, viewMap: true, viewCameras: true, runRoutines: true, weedAim: true, weedBurn: true },
  student: { ...NONE, viewMap: true },
  viewer: { ...NONE, viewMap: true },
};

export interface Access {
  role: Role;
  /** 'all' for owners/admins (every asset the org owns). */
  propertyIds: string[] | 'all';
  productIds: string[] | 'all';
  capabilities: Capabilities;
  canCreateProperty: boolean;
  canCreateProduct: boolean;
}

/**
 * Resolve what a member can see and do: role baseline, plus the union of what their
 * classes grant (teachers get their classes' assets; students get class grants only).
 *
 * @param member  - Membership (role + classIds)
 * @param classes - The org's classes (only the member's are used)
 */
export function resolveAccess(member: MemberDoc, classes: ClassDoc[]): Access {
  const base = ROLE_BASE[member.role];
  if (member.role === 'owner' || member.role === 'admin') {
    return { role: member.role, propertyIds: 'all', productIds: 'all', capabilities: { ...ALL }, canCreateProperty: true, canCreateProduct: true };
  }
  const mine = classes.filter((c) => c.orgId === member.orgId && (
    member.classIds.includes(c.id) || c.teacherUids.includes(member.uid) || c.studentUids.includes(member.uid)));
  const props = new Set<string>(), prods = new Set<string>();
  const caps: Capabilities = { ...base };
  for (const c of mine) {
    c.propertyIds.forEach((p) => props.add(p));
    c.productIds.forEach((p) => prods.add(p));
    if (member.role === 'student' || member.role === 'viewer') {
      for (const k of Object.keys(caps) as (keyof Capabilities)[]) if (c.capabilities[k]) caps[k] = true;
    }
  }
  // Safety: students and viewers never fire a laser, whatever a class says.
  if (member.role === 'student' || member.role === 'viewer') { caps.weedBurn = false; caps.manageDevices = false; }
  return {
    role: member.role, propertyIds: [...props], productIds: [...prods], capabilities: caps,
    canCreateProperty: false, canCreateProduct: false,
  };
}

/** Whether an access grant includes an asset id. */
export const canSee = (list: string[] | 'all', id: string): boolean => list === 'all' || list.includes(id);

/**
 * Check a plan limit before adding something.
 *
 * @returns null when allowed, otherwise the reason (show it and suggest the next plan)
 */
export function planLimitReason(plan: Plan, kind: 'properties' | 'products' | 'classes' | 'seats', current: number): string | null {
  const limit = PLAN_LIMITS[plan][kind];
  if (current < limit) return null;
  const next = (['free', 'classroom', 'school', 'district'] as Plan[]).find((p) => PLAN_LIMITS[p][kind] > current);
  return `The ${PLAN_LIMITS[plan].label} plan includes ${limit} ${kind}.${next ? ` Upgrade to ${PLAN_LIMITS[next].label} for more.` : ''}`;
}

/** Org whose domain matches an email (school Google / Microsoft accounts), if any. */
export function orgForEmail(email: string | null | undefined, orgs: Pick<OrgDoc, 'id' | 'domains'>[]): string | undefined {
  const domain = email?.split('@')[1]?.toLowerCase();
  if (!domain) return undefined;
  return orgs.find((o) => (o.domains ?? []).some((d) => domain === d.toLowerCase() || domain.endsWith(`.${d.toLowerCase()}`)))?.id;
}
