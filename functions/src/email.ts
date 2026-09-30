// email.ts - newsletter (double opt-in) and account email preferences.
//
// Mail is sent by the Firebase "Trigger Email from Firestore" extension
// (firebase/firestore-send-email), which delivers every doc written to /mail via the
// project's SMTP provider. Nothing here talks to an email provider directly, so the
// provider (SendGrid, Mailgun, Google Workspace SMTP ...) is a console setting.
//
//   onNewsletterSignup   newsletterSignups/{id} created -> confirmation email with a token
//                        (throttled per address and per hour so the public form cannot be
//                        used to flood an inbox or burn the mail quota)
//   confirmNewsletter    callable {id, token} -> subscriber confirmed + welcome email with
//                        a working unsubscribe link
//   unsubscribeNewsletter callable {email, token} -> removed (token, or the signed-in owner
//                        of that VERIFIED address)
//   syncEmailPreferences user_preferences/{uid}.email.newsletter -> subscriber list
//
// newsletterSubscribers/{id} keeps the raw unsubscribe token (backend-only collection,
// denied to clients in firestore.rules) so any future newsletter send can build the link
// with unsubscribeUrl().
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { mayEmailConfirmation } from "./emailPolicy";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const SITE = process.env.SITE_URL || "https://tendercells.com";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const subscriberId = (email: string) => hash(email.trim().toLowerCase()).slice(0, 40);

function mail(to: string, subject: string, text: string, html: string) {
  return db.collection("mail").add({ to, message: { subject, text, html } });
}

function sameSecret(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

/** Unsubscribe link for a subscriber doc (use it in every newsletter send). */
export function unsubscribeUrl(email: string, token: string): string {
  return `${SITE}/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

/** Create / refresh a subscriber with an unsubscribe token; returns the token. */
async function upsertSubscriber(email: string, fields: Record<string, unknown>): Promise<string> {
  const ref = db.doc(`newsletterSubscribers/${subscriberId(email)}`);
  const existing = (await ref.get()).get("unsubscribeToken") as string | undefined;
  const token = existing || randomBytes(24).toString("hex");
  await ref.set({ email, ...fields, unsubscribeToken: token, confirmedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  return token;
}

export const onNewsletterSignup = functions.firestore
  .document("newsletterSignups/{id}")
  .onCreate(async (snap, context) => {
    const email = String(snap.get("email") ?? "").trim().toLowerCase();
    if (!email) return;
    const now = Date.now();
    const hourKey = new Date(now).toISOString().slice(0, 13); // YYYY-MM-DDTHH
    const limitRef = db.doc(`newsletterRateLimits/${subscriberId(email)}`);
    const hourRef = db.doc(`newsletterRateLimits/hour_${hourKey}`);
    const subscribed = (await db.doc(`newsletterSubscribers/${subscriberId(email)}`).get()).exists;
    const allowed = !subscribed && await db.runTransaction(async (tx) => {
      const [last, hour] = await Promise.all([tx.get(limitRef), tx.get(hourRef)]);
      if (!mayEmailConfirmation(now, Number(last.get("lastSentMs") ?? 0), Number(hour.get("count") ?? 0))) return false;
      tx.set(limitRef, { lastSentMs: now }, { merge: true });
      tx.set(hourRef, { count: admin.firestore.FieldValue.increment(1) }, { merge: true });
      return true;
    });
    if (!allowed) {
      // Already subscribed, or throttled: drop the request quietly (no email, no error to leak).
      await snap.ref.delete();
      return;
    }
    const token = randomBytes(24).toString("hex");
    await snap.ref.update({ tokenHash: hash(token) });
    const link = `${SITE}/newsletter/confirm?id=${encodeURIComponent(context.params.id)}&token=${token}`;
    await mail(email, "Confirm your Tender Cells newsletter",
      `Confirm your subscription: ${link}\n\nIf you did not ask for this, ignore this email.`,
      `<p>Thanks for signing up for Tender Cells news.</p><p><a href="${link}">Confirm my subscription</a></p>` +
      "<p style=\"color:#777\">If you did not ask for this, ignore this email - you will not be subscribed.</p>");
  });

export const confirmNewsletter = functions.https.onCall(async (data: { id?: string; token?: string }) => {
  const { id, token } = data ?? {};
  if (!id || !token) throw new functions.https.HttpsError("invalid-argument", "Missing confirmation id or token");
  const ref = db.doc(`newsletterSignups/${id}`);
  const snap = await ref.get();
  if (!snap.exists || !sameSecret(String(snap.get("tokenHash") ?? ""), hash(token))) {
    throw new functions.https.HttpsError("not-found", "This confirmation link is invalid or has expired");
  }
  const email = String(snap.get("email")).toLowerCase();
  const unsubToken = await upsertSubscriber(email, { topics: snap.get("topics") ?? ["news"], source: snap.get("source") ?? "site" });
  await ref.delete();
  const unsub = unsubscribeUrl(email, unsubToken);
  await mail(email, "You're subscribed to Tender Cells news",
    `You're subscribed. Unsubscribe any time: ${unsub}`,
    `<p>You're subscribed to Tender Cells news.</p><p style="color:#777"><a href="${unsub}">Unsubscribe</a> any time.</p>`);
  return { ok: true, unsubscribeUrl: unsub };
});

export const unsubscribeNewsletter = functions.https.onCall(async (data: { email?: string; token?: string }, context) => {
  const email = String(data?.email ?? "").trim().toLowerCase();
  const ref = db.doc(`newsletterSubscribers/${subscriberId(email)}`);
  const snap = await ref.get();
  // FIX(2026-09-30): only a VERIFIED account email may unsubscribe without the link token;
  // otherwise anyone could register an unverified account with someone else's address.
  const ownAccount = context.auth?.token.email_verified === true && context.auth.token.email?.toLowerCase() === email;
  if (!snap.exists) return { ok: true };
  if (!ownAccount && !sameSecret(String(snap.get("unsubscribeToken") ?? ""), String(data?.token ?? ""))) {
    throw new functions.https.HttpsError("permission-denied", "Invalid unsubscribe link");
  }
  await ref.delete();
  await db.doc(`newsletterRateLimits/${subscriberId(email)}`).delete().catch(() => undefined);
  return { ok: true };
});

/** Signed-in users manage the newsletter from Account → Email preferences. */
export const syncEmailPreferences = functions.firestore
  .document("user_preferences/{uid}")
  .onWrite(async (change, context) => {
    const wants = change.after.exists && change.after.get("email.newsletter") === true;
    const had = change.before.exists && change.before.get("email.newsletter") === true;
    if (wants === had) return;
    const user = await admin.auth().getUser(context.params.uid).catch(() => null);
    if (!user?.email) return;
    const email = user.email.toLowerCase();
    if (!wants) {
      await db.doc(`newsletterSubscribers/${subscriberId(email)}`).delete();
      return;
    }
    // Verified by sign-in (Google / Microsoft) or the verification email: subscribe now.
    if (user.emailVerified || user.providerData.some((p) => p.providerId !== "password")) {
      await upsertSubscriber(email, { topics: ["news"], source: "account", uid: user.uid });
      return;
    }
    // FIX(2026-09-30): unverified password accounts used to be silently skipped forever.
    // Send them the normal double opt-in email instead; clicking it proves the address.
    await db.collection("newsletterSignups").add({
      email, topics: ["news"], source: "account", status: "pending", createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
