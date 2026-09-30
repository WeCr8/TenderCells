// AccountSettings.tsx - email preferences and billing settings on the website account page.
//
// Preferences:  user_preferences/{uid} { email: {...}, billing: { billingEmail, invoiceEmails } }
//               (owner read/write in firestore.rules). The syncEmailPreferences Cloud
//               Function mirrors email.newsletter into the subscriber list.
// Billing:      billingSubscriptions/{uid} is written by the Stripe webhook (functions/src/billing.ts,
//               owner read-only). Checkout and the billing portal live in the OS (Account -> Billing).
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { getDb } from "../lib/firestore";

interface EmailPrefs {
  newsletter: boolean;
  productUpdates: boolean;
  lessonDigests: boolean;
  deviceAlerts: boolean;
  frequency: "instant" | "daily" | "weekly";
}
interface BillingPrefs { billingEmail: string; invoiceEmails: boolean }

const DEFAULT_EMAIL: EmailPrefs = { newsletter: false, productUpdates: true, lessonDigests: false, deviceAlerts: true, frequency: "instant" };

const EMAIL_OPTIONS: Array<{ key: keyof Omit<EmailPrefs, "frequency">; label: string; help: string }> = [
  { key: "deviceAlerts", label: "Device alerts", help: "Predators, E-STOP, faults and eggs ready." },
  { key: "productUpdates", label: "Product & firmware updates", help: "New features and important fixes." },
  { key: "lessonDigests", label: "Lesson digest", help: "New lessons and classroom projects." },
  { key: "newsletter", label: "Newsletter", help: "Occasional news from Tender Cells." },
];

const PLAN_LABEL: Record<string, string> = { free: "Free", starter_monthly: "Starter (monthly)", school_annual: "School (annual)" };

/** Email notification preferences (saved to Firestore as you change them). */
export function EmailPreferences({ user }: { user: User }) {
  const [prefs, setPrefs] = useState<EmailPrefs>(DEFAULT_EMAIL);
  const [billing, setBilling] = useState<BillingPrefs>({ billingEmail: user.email ?? "", invoiceEmails: true });
  const [plan, setPlan] = useState<{ plan: string; status?: string } | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "saving" | "saved" | "error">("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ doc, getDoc }, db] = await Promise.all([import("firebase/firestore"), getDb()]);
        const [p, b] = await Promise.all([getDoc(doc(db, "user_preferences", user.uid)), getDoc(doc(db, "billingSubscriptions", user.uid))]);
        if (!alive) return;
        const data = p.data() as { email?: Partial<EmailPrefs>; billing?: Partial<BillingPrefs> } | undefined;
        setPrefs({ ...DEFAULT_EMAIL, ...(data?.email ?? {}) });
        setBilling((cur) => ({ ...cur, ...(data?.billing ?? {}) }));
        const sub = b.data() as { plan?: string | null; status?: string } | undefined;
        setPlan({ plan: sub?.plan ?? "free", status: sub?.status });
        setState("ready");
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => { alive = false; };
  }, [user.uid]);

  const save = async (nextEmail: EmailPrefs, nextBilling: BillingPrefs) => {
    setPrefs(nextEmail);
    setBilling(nextBilling);
    setState("saving");
    try {
      const [{ doc, setDoc, serverTimestamp }, db] = await Promise.all([import("firebase/firestore"), getDb()]);
      await setDoc(doc(db, "user_preferences", user.uid), { email: nextEmail, billing: nextBilling, updatedAt: serverTimestamp() }, { merge: true });
      setState("saved");
    } catch {
      setState("error");
    }
  };

  return (
    <>
      <div className="account-section" data-testid="email-preferences">
        <h2>Email preferences</h2>
        {state === "loading" ? <p className="account-sub">Loading…</p> : (
          <div className="account-prefs">
            {EMAIL_OPTIONS.map((o) => (
              <label key={o.key} className="account-check">
                <input type="checkbox" checked={prefs[o.key]} onChange={(e) => void save({ ...prefs, [o.key]: e.target.checked }, billing)} />
                <span>{o.label}<small>{o.help}</small></span>
              </label>
            ))}
            <label className="account-check">
              Alert emails
              <select value={prefs.frequency} onChange={(e) => void save({ ...prefs, frequency: e.target.value as EmailPrefs["frequency"] }, billing)}>
                <option value="instant">as they happen</option>
                <option value="daily">daily summary</option>
                <option value="weekly">weekly summary</option>
              </select>
            </label>
            <p className="account-hint">Security emails (sign-in, password, verification) are always sent.</p>
          </div>
        )}
      </div>

      <div className="account-section" data-testid="billing-settings">
        <h2>Billing</h2>
        <ul className="account-types">
          <li className="current">
            <div>
              <strong>Plan: {plan ? PLAN_LABEL[plan.plan] ?? plan.plan : "…"}</strong>
              <span>{plan?.status ? `Status: ${plan.status}` : "Free - start a 30-day Starter trial or a school plan in the OS."}</span>
            </div>
            <span className="account-badge">Current</span>
          </li>
        </ul>
        <div className="account-prefs" style={{ marginTop: "0.6rem" }}>
          <label>
            Billing email
            <input type="email" value={billing.billingEmail} onChange={(e) => setBilling({ ...billing, billingEmail: e.target.value })}
              onBlur={() => void save(prefs, billing)} />
          </label>
          <label className="account-check">
            <input type="checkbox" checked={billing.invoiceEmails} onChange={(e) => void save(prefs, { ...billing, invoiceEmails: e.target.checked })} />
            <span>Email me receipts and invoices</span>
          </label>
        </div>
        <div className="account-actions" style={{ marginTop: "0.6rem" }}>
          <a className="btn-outline" href="/app/account">Upgrade, payment method &amp; invoices</a>
        </div>
        <p className="account-hint">Checkout, the billing portal and school purchase orders open from Tender Cells OS → Account → Billing.</p>
      </div>
      {state === "saved" && <p className="account-notice" role="status">Preferences saved.</p>}
      {state === "error" && <p className="account-error" role="alert">Could not load or save preferences. Try again later.</p>}
    </>
  );
}

export default EmailPreferences;
