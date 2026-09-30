// email.ts - newsletter (double opt-in) and account email preferences.
//
// Mail is sent by the Firebase "Trigger Email from Firestore" extension
// (firebase/firestore-send-email), which delivers every doc written to /mail via the
// project's SMTP provider. Nothing here talks to an email provider directly, so the
// provider (SendGrid, Mailgun, Google Workspace SMTP ...) is a console setting.
//
//   onNewsletterSignup   newsletterSignups/{id} created -> confirmation email with a token
//   confirmNewsletter    callable {id, token} -> subscriber confirmed
//   unsubscribeNewsletter callable {email, token} -> removed
//   syncEmailPreferences user_preferences/{uid}.email.newsletter -> subscriber list
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createHash, randomBytes } from "crypto";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const SITE = process.env.SITE_URL || "https://tendercells.com";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const subscriberId = (email: string) => hash(email.trim().toLowerCase()).slice(0, 40);

function mail(to: string, subject: string, text: string, html: string) {
  return db.collection("mail").add({ to, message: { subject, text, html } });
}

export const onNewsletterSignup = functions.firestore
  .document("newsletterSignups/{id}")
  .onCreate(async (snap, context) => {
    const email = String(snap.get("email") ?? "").trim().toLowerCase();
    if (!email) return;
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
  if (!snap.exists || snap.get("tokenHash") !== hash(token)) {
    throw new functions.https.HttpsError("not-found", "This confirmation link is invalid or has expired");
  }
  const email = String(snap.get("email")).toLowerCase();
  const unsubToken = randomBytes(24).toString("hex");
  await db.doc(`newsletterSubscribers/${subscriberId(email)}`).set({
    email, topics: snap.get("topics") ?? ["news"], source: snap.get("source") ?? "site",
    confirmedAt: admin.firestore.FieldValue.serverTimestamp(), unsubscribeTokenHash: hash(unsubToken),
  }, { merge: true });
  await ref.update({ status: "confirmed", tokenHash: admin.firestore.FieldValue.delete() });
  return { ok: true, unsubscribeUrl: `${SITE}/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}` };
});

export const unsubscribeNewsletter = functions.https.onCall(async (data: { email?: string; token?: string }, context) => {
  const email = String(data?.email ?? "").trim().toLowerCase();
  const ref = db.doc(`newsletterSubscribers/${subscriberId(email)}`);
  const snap = await ref.get();
  const ownAccount = context.auth?.token.email?.toLowerCase() === email;
  if (!snap.exists) return { ok: true };
  if (!ownAccount && snap.get("unsubscribeTokenHash") !== hash(String(data?.token ?? ""))) {
    throw new functions.https.HttpsError("permission-denied", "Invalid unsubscribe link");
  }
  await ref.delete();
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
    const ref = db.doc(`newsletterSubscribers/${subscriberId(user.email)}`);
    // The account email is already verified by sign-in (Google) or the verification email.
    if (wants && (user.emailVerified || user.providerData.some((p) => p.providerId !== "password"))) {
      await ref.set({ email: user.email.toLowerCase(), topics: ["news"], source: "account", uid: user.uid,
        confirmedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    } else if (!wants) {
      await ref.delete();
    }
  });
