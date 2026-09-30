// orgs.ts - school / district / farm organizations (see shared/org/orgModel.ts).
//
//   syncClassAccess     classes change -> recompute each affected member's
//                       allowedPropertyIds / allowedProductIds (read by firestore.rules)
//   enforceOrgPlanLimits a new org-owned property/product over the plan limit is removed
//                       and the org gets a notice (rules cannot count documents)
//   onUserCreated       an account whose email domain belongs to an org gets a join
//                       request for that org's staff to approve (never auto-granted)
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Keep in sync with shared/org/orgModel.ts PLAN_LIMITS.
const PLAN_LIMITS: Record<string, { properties: number; products: number }> = {
  free: { properties: 1, products: 3 },
  classroom: { properties: 1, products: 10 },
  school: { properties: 3, products: 40 },
  district: { properties: 50, products: 1000 },
};

interface ClassDoc { teacherUids?: string[]; studentUids?: string[]; propertyIds?: string[]; productIds?: string[] }

/** Union of property / product ids across the classes a member belongs to or teaches. */
async function recomputeMember(orgId: string, uid: string): Promise<void> {
  const memberRef = db.doc(`orgs/${orgId}/members/${uid}`);
  const member = await memberRef.get();
  if (!member.exists) return;
  const classIds: string[] = member.get("classIds") ?? [];
  const classes = await db.collection(`orgs/${orgId}/classes`).get();
  const props = new Set<string>();
  const prods = new Set<string>();
  classes.forEach((c) => {
    const d = c.data() as ClassDoc;
    if (classIds.includes(c.id) || d.teacherUids?.includes(uid) || d.studentUids?.includes(uid)) {
      d.propertyIds?.forEach((p) => props.add(p));
      d.productIds?.forEach((p) => prods.add(p));
    }
  });
  await memberRef.update({
    allowedPropertyIds: [...props],
    allowedProductIds: [...prods],
    accessUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export const syncClassAccess = functions.firestore
  .document("orgs/{orgId}/classes/{classId}")
  .onWrite(async (change, context) => {
    const { orgId } = context.params as { orgId: string };
    const uids = new Set<string>();
    for (const snap of [change.before, change.after]) {
      if (!snap.exists) continue;
      const d = snap.data() as ClassDoc;
      [...(d.teacherUids ?? []), ...(d.studentUids ?? [])].forEach((u) => uids.add(u));
    }
    // Members who list this class in classIds too.
    const listed = await db.collection(`orgs/${orgId}/members`).where("classIds", "array-contains", context.params.classId).get();
    listed.forEach((m) => uids.add(m.id));
    await Promise.all([...uids].map((uid) => recomputeMember(orgId, uid)));
  });

export const syncMemberAccess = functions.firestore
  .document("orgs/{orgId}/members/{uid}")
  .onWrite(async (change, context) => {
    if (!change.after.exists) return;
    const before: string[] = change.before.exists ? change.before.get("classIds") ?? [] : [];
    const after: string[] = change.after.get("classIds") ?? [];
    if (change.before.exists && before.join() === after.join()) return; // our own update
    const { orgId, uid } = context.params as { orgId: string; uid: string };
    await recomputeMember(orgId, uid);
  });

function planGuard(collection: "properties" | "products") {
  return functions.firestore.document(`${collection}/{id}`).onCreate(async (snap) => {
    const orgId = snap.get("orgId") as string | undefined;
    if (!orgId) return;
    const org = await db.doc(`orgs/${orgId}`).get();
    const plan = (org.get("plan") as string) ?? "free";
    const limit = (PLAN_LIMITS[plan] ?? PLAN_LIMITS.free)[collection];
    const count = (await db.collection(collection).where("orgId", "==", orgId).count().get()).data().count;
    if (count <= limit) return;
    await snap.ref.delete();
    await db.collection(`orgs/${orgId}/notices`).add({
      type: "plan_limit",
      message: `Your ${plan} plan includes ${limit} ${collection}. "${snap.get("name") ?? snap.id}" was not added - upgrade the plan for more.`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}
export const enforceOrgPropertyLimit = planGuard("properties");
export const enforceOrgProductLimit = planGuard("products");

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const domain = user.email?.split("@")[1]?.toLowerCase();
  if (!domain) return;
  // Exact domain plus parent domains (students.school.org -> school.org).
  const parts = domain.split(".");
  const candidates = parts.map((_, i) => parts.slice(i).join(".")).filter((d) => d.includes("."));
  const orgs = await db.collection("orgs").where("domains", "array-contains-any", candidates.slice(0, 10)).get();
  await Promise.all(orgs.docs.map((org) => db.doc(`orgs/${org.id}/joinRequests/${user.uid}`).set({
    email: user.email,
    displayName: user.displayName ?? null,
    provider: user.providerData[0]?.providerId ?? "password",
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })));
});
