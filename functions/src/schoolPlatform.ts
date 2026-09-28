import { createHash, createHmac, randomBytes } from "node:crypto";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

type SchoolRole = "district-admin" | "school-admin" | "teacher" | "student";
type ProviderKind = "google-workspace" | "microsoft-education" | "clever" | "classlink" | "saml";

interface RosterEntry {
  externalId: string;
  email?: string;
  displayName?: string;
  role: SchoolRole;
  schoolId: string;
  classIds?: string[];
}

function requireAuth(context: functions.https.CallableContext): string {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  return context.auth.uid;
}

function requirePlatformAdmin(context: functions.https.CallableContext): string {
  const uid = requireAuth(context);
  if (context.auth?.token.platformAdmin !== true) {
    throw new functions.https.HttpsError("permission-denied", "TenderCells platform administrator access required");
  }
  return uid;
}

function cleanId(value: unknown, label: string): string {
  const result = String(value || "").trim();
  if (!/^[A-Za-z0-9_-]{2,80}$/.test(result)) {
    throw new functions.https.HttpsError("invalid-argument", `${label} is invalid`);
  }
  return result;
}

async function requireOrganizationRole(uid: string, organizationId: string, allowed: SchoolRole[]) {
  const membership = await db.doc(`organizations/${organizationId}/members/${uid}`).get();
  const role = membership.data()?.role as SchoolRole | undefined;
  if (!membership.exists || !role || !allowed.includes(role)) {
    throw new functions.https.HttpsError("permission-denied", "Organization administrator access required");
  }
  return { role, membership: membership.data() || {} };
}

async function canAccessDevice(uid: string, deviceId: string): Promise<boolean> {
  const device = await db.doc(`devices/${deviceId}`).get();
  if (!device.exists) return false;
  const data = device.data() || {};
  if (data.userId === uid) return true;
  const organizationId = typeof data.organizationId === "string" ? data.organizationId : "";
  if (!organizationId) return false;
  const member = await db.doc(`organizations/${organizationId}/members/${uid}`).get();
  if (!member.exists || member.data()?.status !== "active") return false;
  const memberData = member.data() || {};
  return memberData.allDeviceAccess === true ||
    (Array.isArray(memberData.deviceIds) && memberData.deviceIds.includes(deviceId));
}

/** Bootstrap or update a district after approval. Provider IDs are public; secrets stay in Identity Platform. */
export const configureSchoolOrganization = functions.https.onCall(async (
  data: {
    organizationId?: string;
    displayName?: string;
    loginCode?: string;
    approvedDomains?: string[];
    identityProviders?: Array<{ kind: ProviderKind; label: string; providerId: string; tenantId: string; enabled: boolean }>;
    initialAdminEmail?: string;
  },
  context,
) => {
  const actorUid = requirePlatformAdmin(context);
  const organizationId = cleanId(data?.organizationId, "organizationId");
  const loginCode = cleanId(data?.loginCode, "loginCode").toUpperCase();
  const displayName = String(data?.displayName || "").trim().slice(0, 160);
  if (!displayName) throw new functions.https.HttpsError("invalid-argument", "displayName is required");
  const providers = Array.isArray(data.identityProviders) ? data.identityProviders : [];
  for (const provider of providers) {
    if (!provider.providerId || !provider.tenantId) {
      throw new functions.https.HttpsError("invalid-argument", "Every identity provider requires providerId and tenantId");
    }
  }
  const organizationRef = db.doc(`organizations/${organizationId}`);
  const existingOrganization = await organizationRef.get();
  await organizationRef.set({
    displayName,
    loginCode,
    approvedDomains: (data.approvedDomains || []).map((domain) => String(domain).trim().toLowerCase()).filter(Boolean),
    identityProviders: providers.map((provider) => ({
      kind: provider.kind,
      label: String(provider.label || provider.kind).slice(0, 100),
      providerId: String(provider.providerId),
      tenantId: String(provider.tenantId),
      enabled: provider.enabled === true,
    })),
    billingStatus: "setup_required",
    status: "active",
    updatedBy: actorUid,
    updatedAt: FieldValue.serverTimestamp(),
    ...(!existingOrganization.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
  }, { merge: true });
  if (data.initialAdminEmail) {
    const user = await admin.auth().getUserByEmail(String(data.initialAdminEmail).trim().toLowerCase());
    await db.doc(`organizations/${organizationId}/members/${user.uid}`).set({
      userId: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      role: "district-admin",
      status: "active",
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await admin.auth().setCustomUserClaims(user.uid, {
      ...(user.customClaims || {}), organizationId, schoolRole: "district-admin", classIds: [],
    });
  }
  return { organizationId, status: "active" };
});

/** Public provider discovery by a district-issued organization code. No secrets are returned. */
export const getSchoolLoginOptions = functions.https.onCall(async (data: { organizationCode?: string }) => {
  const code = cleanId(data?.organizationCode, "organizationCode").toUpperCase();
  const snap = await db.collection("organizations").where("loginCode", "==", code).limit(1).get();
  if (snap.empty) throw new functions.https.HttpsError("not-found", "School organization not found");
  const organization = snap.docs[0].data();
  if (organization.status !== "active") throw new functions.https.HttpsError("failed-precondition", "School sign-in is not active");
  const providers = Array.isArray(organization.identityProviders) ? organization.identityProviders : [];
  return {
    organizationId: snap.docs[0].id,
    displayName: String(organization.displayName || "School organization"),
    providers: providers
      .filter((provider: Record<string, unknown>) => provider.enabled === true)
      .map((provider: Record<string, unknown>) => ({
        kind: provider.kind as ProviderKind,
        label: String(provider.label || provider.kind || "School sign-in"),
        providerId: String(provider.providerId || ""),
        tenantId: String(provider.tenantId || ""),
      }))
      .filter((provider: { providerId: string; tenantId: string }) => provider.providerId && provider.tenantId),
  };
});

/** District-authorized normalized roster import. Vendor access tokens stay server-side. */
export const syncSchoolRoster = functions.https.onCall(async (
  data: { organizationId?: string; source?: ProviderKind | "csv"; entries?: RosterEntry[] },
  context,
) => {
  const uid = requireAuth(context);
  const organizationId = cleanId(data?.organizationId, "organizationId");
  await requireOrganizationRole(uid, organizationId, ["district-admin", "school-admin"]);
  const entries = Array.isArray(data?.entries) ? data.entries : [];
  if (!entries.length || entries.length > 200) {
    throw new functions.https.HttpsError("invalid-argument", "Roster batch must contain 1 to 200 entries");
  }

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();
  for (const entry of entries) {
    const externalId = cleanId(entry.externalId, "externalId");
    const schoolId = cleanId(entry.schoolId, "schoolId");
    if (!["district-admin", "school-admin", "teacher", "student"].includes(entry.role)) {
      throw new functions.https.HttpsError("invalid-argument", "Roster role is invalid");
    }
    const ref = db.doc(`organizations/${organizationId}/roster/${externalId}`);
    batch.set(ref, {
      externalId,
      email: entry.email ? String(entry.email).trim().toLowerCase() : null,
      displayName: entry.displayName ? String(entry.displayName).trim().slice(0, 120) : null,
      role: entry.role,
      schoolId,
      classIds: Array.isArray(entry.classIds) ? entry.classIds.map((id) => cleanId(id, "classId")).slice(0, 50) : [],
      source: data.source || "csv",
      status: "active",
      updatedAt: now,
    }, { merge: true });
  }
  await batch.commit();
  await db.collection(`organizations/${organizationId}/audit`).add({
    action: "roster.sync",
    actorUid: uid,
    source: data.source || "csv",
    count: entries.length,
    createdAt: now,
  });
  return { synchronized: entries.length };
});

/** Link the signed-in Firebase account to an approved roster identity and refresh custom claims. */
export const claimSchoolMembership = functions.https.onCall(async (
  data: { organizationId?: string; externalId?: string },
  context,
) => {
  const uid = requireAuth(context);
  const organizationId = cleanId(data?.organizationId, "organizationId");
  const authUser = await admin.auth().getUser(uid);
  let roster: admin.firestore.DocumentSnapshot;
  if (data?.externalId) {
    const externalId = cleanId(data.externalId, "externalId");
    roster = await db.doc(`organizations/${organizationId}/roster/${externalId}`).get();
  } else if (authUser.email) {
    const matches = await db.collection(`organizations/${organizationId}/roster`)
      .where("email", "==", authUser.email.toLowerCase()).limit(1).get();
    if (matches.empty) throw new functions.https.HttpsError("permission-denied", "No roster membership matches this account");
    roster = matches.docs[0];
  } else {
    throw new functions.https.HttpsError("invalid-argument", "externalId is required when the identity provider supplies no email");
  }
  if (!roster.exists || roster.data()?.status !== "active") {
    throw new functions.https.HttpsError("permission-denied", "No active roster membership was found");
  }
  const rosterData = roster.data() || {};
  if (rosterData.email && authUser.email?.toLowerCase() !== String(rosterData.email).toLowerCase()) {
    throw new functions.https.HttpsError("permission-denied", "Signed-in account does not match the roster entry");
  }
  const claims = {
    ...(authUser.customClaims || {}),
    organizationId,
    schoolId: rosterData.schoolId,
    schoolRole: rosterData.role,
    classIds: Array.isArray(rosterData.classIds) ? rosterData.classIds.slice(0, 50) : [],
  };
  await admin.auth().setCustomUserClaims(uid, claims);
  await db.doc(`organizations/${organizationId}/members/${uid}`).set({
    userId: uid,
    externalId: roster.id,
    email: authUser.email || null,
    displayName: authUser.displayName || rosterData.displayName || null,
    role: rosterData.role,
    schoolId: rosterData.schoolId,
    classIds: claims.classIds,
    status: "active",
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return { organizationId, role: rosterData.role, refreshTokenRequired: true };
});

/** Create a school purchase-order request; payment collection is deliberately separate. */
export const createPurchaseOrder = functions.https.onCall(async (
  data: { organizationId?: string; amountCents?: number; currency?: string; description?: string; externalPoNumber?: string },
  context,
) => {
  const uid = requireAuth(context);
  const organizationId = cleanId(data?.organizationId, "organizationId");
  await requireOrganizationRole(uid, organizationId, ["district-admin", "school-admin"]);
  const amountCents = Math.round(Number(data?.amountCents));
  if (!Number.isSafeInteger(amountCents) || amountCents < 100 || amountCents > 100_000_000) {
    throw new functions.https.HttpsError("invalid-argument", "Purchase-order amount is invalid");
  }
  const ref = db.collection(`organizations/${organizationId}/purchaseOrders`).doc();
  await ref.set({
    organizationId,
    amountCents,
    currency: String(data.currency || "USD").toUpperCase().slice(0, 3),
    description: String(data.description || "").trim().slice(0, 500),
    externalPoNumber: String(data.externalPoNumber || "").trim().slice(0, 80) || null,
    status: "submitted",
    submittedBy: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { purchaseOrderId: ref.id, status: "submitted" };
});

/** Platform-side invoice creation from an approved purchase order. */
export const createOrganizationInvoice = functions.https.onCall(async (
  data: { organizationId?: string; purchaseOrderId?: string; dueAt?: number; memo?: string },
  context,
) => {
  const uid = requirePlatformAdmin(context);
  const organizationId = cleanId(data?.organizationId, "organizationId");
  const purchaseOrderId = cleanId(data?.purchaseOrderId, "purchaseOrderId");
  const purchaseOrderRef = db.doc(`organizations/${organizationId}/purchaseOrders/${purchaseOrderId}`);
  const ref = db.collection(`organizations/${organizationId}/invoices`).doc();
  await db.runTransaction(async (transaction) => {
    const purchaseOrder = await transaction.get(purchaseOrderRef);
    if (!purchaseOrder.exists || !["submitted", "approved"].includes(String(purchaseOrder.data()?.status))) {
      throw new functions.https.HttpsError("failed-precondition", "Purchase order is not available for invoicing");
    }
    const po = purchaseOrder.data() || {};
    transaction.set(ref, {
      organizationId,
      purchaseOrderId,
      amountCents: po.amountCents,
      currency: po.currency,
      memo: String(data.memo || po.description || "").trim().slice(0, 500),
      status: "open",
      dueAt: admin.firestore.Timestamp.fromMillis(Number(data.dueAt) || Date.now() + 30 * 86_400_000),
      createdBy: uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(purchaseOrderRef, {
      status: "invoiced",
      invoiceId: ref.id,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return { invoiceId: ref.id, status: "open" };
});

/** Issue a short-lived, owner-authorized signaling session for an HTTPS/WebRTC relay. */
export const createCameraRelaySession = functions.https.onCall(async (
  data: { deviceId?: string },
  context,
) => {
  const uid = requireAuth(context);
  const deviceId = cleanId(data?.deviceId, "deviceId");
  if (!(await canAccessDevice(uid, deviceId))) {
    throw new functions.https.HttpsError("permission-denied", "Camera device access denied");
  }
  const turnUrls = String(process.env.TURN_URLS || "").split(",").map((url) => url.trim()).filter(Boolean);
  const turnSecret = process.env.TURN_SHARED_SECRET || "";
  if (!turnUrls.length || !turnSecret) {
    throw new functions.https.HttpsError("failed-precondition", "Authenticated camera relay is not configured");
  }
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60_000);
  const ref = db.collection("cameraRelaySessions").doc();
  await ref.set({
    deviceId,
    viewerUid: uid,
    tokenHash,
    status: "created",
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
  });
  const turnUsername = `${Math.floor(expiresAt.toMillis() / 1000)}:${uid}`;
  const turnCredential = createHmac("sha1", turnSecret).update(turnUsername).digest("base64");
  return {
    sessionId: ref.id,
    token,
    expiresAt: expiresAt.toMillis(),
    iceServers: [
      { urls: ["stun:stun.l.google.com:19302"] },
      { urls: turnUrls, username: turnUsername, credential: turnCredential },
    ],
  };
});

/**
 * HTTPS signaling channel used by an approved WebRTC camera bridge.
 * This carries offers/answers/ICE only; camera media remains encrypted by WebRTC.
 */
export const cameraRelaySignal = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "https://tendercells.com");
  res.set("Vary", "Origin");
  res.set("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.status(204).send("");
    return;
  }
  if (req.get("origin") && req.get("origin") !== "https://tendercells.com") {
    res.status(403).json({ error: "origin_denied" });
    return;
  }
  const sessionId = String(req.query.sessionId || req.body?.sessionId || "");
  const bearer = req.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!/^[A-Za-z0-9_-]{2,80}$/.test(sessionId) || !bearer) {
    res.status(401).json({ error: "session_token_required" });
    return;
  }
  const sessionRef = db.doc(`cameraRelaySessions/${sessionId}`);
  const session = await sessionRef.get();
  const sessionData = session.data();
  const tokenHash = createHash("sha256").update(bearer).digest("hex");
  if (!session.exists || sessionData?.tokenHash !== tokenHash ||
      sessionData.expiresAt?.toMillis?.() <= Date.now() || sessionData.status === "revoked") {
    res.status(401).json({ error: "session_expired_or_invalid" });
    return;
  }
  if (req.method === "POST") {
    const kind = String(req.body?.kind || "");
    if (!["offer", "answer", "candidate", "ready", "close"].includes(kind)) {
      res.status(400).json({ error: "invalid_signal_kind" });
      return;
    }
    const payload = JSON.stringify(req.body?.payload ?? null);
    if (Buffer.byteLength(payload, "utf8") > 64 * 1024) {
      res.status(413).json({ error: "signal_too_large" });
      return;
    }
    const signal = await sessionRef.collection("signals").add({
      kind,
      payload: JSON.parse(payload),
      sender: String(req.body?.sender || "viewer").slice(0, 20),
      createdAt: FieldValue.serverTimestamp(),
    });
    res.status(201).json({ signalId: signal.id });
    return;
  }
  if (req.method === "GET") {
    const after = Number(req.query.after || 0);
    const signals = await sessionRef.collection("signals").orderBy("createdAt", "asc").limit(100).get();
    res.json({
      signals: signals.docs.map((doc) => {
        const value = doc.data();
        const createdAt = value.createdAt?.toMillis?.() || 0;
        return { id: doc.id, ...value, createdAt };
      }).filter((signal) => signal.createdAt > after),
      expiresAt: sessionData?.expiresAt.toMillis(),
    });
    return;
  }
  res.status(405).json({ error: "method_not_allowed" });
});
