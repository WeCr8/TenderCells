import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const db = admin.firestore();
const APP_URL = "https://tendercells.com/app/account";

type Plan = "starter_monthly" | "school_annual";

function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key) throw new functions.https.HttpsError("failed-precondition", "Stripe billing is not configured");
  return new Stripe(key);
}

async function requireSchoolAdmin(uid: string, organizationId: string): Promise<void> {
  const membership = await db.doc(`organizations/${organizationId}/members/${uid}`).get();
  if (!membership.exists || !["district-admin", "school-admin"].includes(String(membership.data()?.role))) {
    throw new functions.https.HttpsError("permission-denied", "School billing requires an organization administrator");
  }
}

async function customerFor(uid: string, email?: string | null): Promise<string> {
  const stripe = stripeClient();
  const ref = db.doc(`billingCustomers/${uid}`);
  const snapshot = await ref.get();
  const existing = String(snapshot.data()?.stripeCustomerId || "");
  if (existing) return existing;
  const customer = await stripe.customers.create({ email: email || undefined, metadata: { firebaseUid: uid } });
  await ref.set({ stripeCustomerId: customer.id, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  return customer.id;
}

export const createBillingCheckout = functions.runWith({ secrets: ["STRIPE_SECRET_KEY"] }).https.onCall(async (
  data: { plan?: Plan; organizationId?: string }, context,
) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in before starting checkout");
  if (context.auth.token.platformOwner === true || context.auth.token.platformAdmin === true) {
    throw new functions.https.HttpsError("failed-precondition", "Cloud billing is included for this platform owner account");
  }
  const plan = data?.plan;
  if (!plan || !["starter_monthly", "school_annual"].includes(plan)) {
    throw new functions.https.HttpsError("invalid-argument", "Unknown billing plan");
  }
  const organizationId = String(data.organizationId || "").trim();
  if (plan === "school_annual") {
    if (!organizationId) throw new functions.https.HttpsError("invalid-argument", "School organization is required");
    await requireSchoolAdmin(context.auth.uid, organizationId);
  }
  const price = plan === "starter_monthly" ? process.env.STRIPE_STARTER_PRICE_ID : process.env.STRIPE_SCHOOL_PRICE_ID;
  if (!price) throw new functions.https.HttpsError("failed-precondition", "This billing plan is not configured");
  const customer = await customerFor(context.auth.uid, context.auth.token.email as string | undefined);
  const session = await stripeClient().checkout.sessions.create({
    mode: "subscription",
    payment_method_collection: "if_required",
    customer,
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: true,
    tax_id_collection: { enabled: true },
    billing_address_collection: "required",
    subscription_data: {
      trial_period_days: plan === "starter_monthly" ? 30 : 60,
      trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      metadata: { firebaseUid: context.auth.uid, plan, organizationId },
    },
    metadata: { firebaseUid: context.auth.uid, plan, organizationId },
    success_url: `${APP_URL}?billing=success`,
    cancel_url: `${APP_URL}?billing=cancelled`,
  });
  return { url: session.url };
});

export const createBillingPortal = functions.runWith({ secrets: ["STRIPE_SECRET_KEY"] }).https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in to manage billing");
  if (context.auth.token.platformOwner === true || context.auth.token.platformAdmin === true) {
    throw new functions.https.HttpsError("failed-precondition", "Cloud billing is included for this platform owner account");
  }
  const customer = await customerFor(context.auth.uid, context.auth.token.email as string | undefined);
  const session = await stripeClient().billingPortal.sessions.create({ customer, return_url: APP_URL });
  return { url: session.url };
});

export const stripeBillingWebhook = functions.runWith({ secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] }).https.onRequest(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) { res.status(400).send("Missing signature"); return; }
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(req.rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch {
    res.status(400).send("Invalid signature"); return;
  }
  if (event.type.startsWith("customer.subscription.")) {
    const subscription = event.data.object as Stripe.Subscription;
    const uid = subscription.metadata.firebaseUid;
    if (uid) {
      await db.doc(`billingSubscriptions/${uid}`).set({
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: String(subscription.customer),
        plan: subscription.metadata.plan || null,
        organizationId: subscription.metadata.organizationId || null,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }
  res.status(200).json({ received: true });
});
