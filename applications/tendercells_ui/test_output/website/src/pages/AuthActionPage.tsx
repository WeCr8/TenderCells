// AuthActionPage.tsx - tendercells.com/account/action: where Firebase's auth emails land.
//
// Set Firebase console → Authentication → Templates → (each template) → Customize action
// URL to https://tendercells.com/account/action. Handles ?mode=verifyEmail |
// resetPassword | recoverEmail | verifyAndChangeEmail with the oobCode from the email,
// so people finish on our own branded page instead of firebaseapp.com.
import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { applyActionCode, checkActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import PageLayout from "../components/PageLayout";
import { auth } from "../lib/firebase";
import "./AccountPage.css";

type Status = { kind: "working" | "done" | "error" | "form"; message: string; email?: string };

export default function AuthActionPage() {
  const [params] = useSearchParams();
  const mode = params.get("mode");
  const code = params.get("oobCode") ?? "";
  const [status, setStatus] = useState<Status>({ kind: "working", message: "Checking your link…" });
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!auth || !code) { setStatus({ kind: "error", message: "This link is incomplete. Request a new email from your account page." }); return; }
    const a = auth;
    (async () => {
      try {
        if (mode === "verifyEmail" || mode === "verifyAndChangeEmail") {
          await applyActionCode(a, code);
          await a.currentUser?.reload().catch(() => undefined);
          setStatus({ kind: "done", message: mode === "verifyEmail" ? "Your email is verified. Thanks!" : "Your new email address is confirmed." });
        } else if (mode === "resetPassword") {
          const email = await verifyPasswordResetCode(a, code);
          setStatus({ kind: "form", message: "Choose a new password.", email });
        } else if (mode === "recoverEmail") {
          const info = await checkActionCode(a, code);
          await applyActionCode(a, code);
          setStatus({ kind: "done", message: `Your sign-in email was changed back to ${info.data.email ?? "your original address"}. If you did not change it, reset your password now.` });
        } else {
          setStatus({ kind: "error", message: "Unknown action link." });
        }
      } catch {
        setStatus({ kind: "error", message: "This link has expired or was already used. Request a new email from your account page." });
      }
    })();
  }, [mode, code]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    try {
      await confirmPasswordReset(auth, code, password);
      setStatus({ kind: "done", message: "Password changed. You can log in with it now." });
    } catch {
      setStatus({ kind: "error", message: "Could not change the password - the link may have expired, or the password is too weak (6+ characters)." });
    }
  };

  return (
    <PageLayout>
      <div className="account-page">
        <section className="account-card" aria-live="polite">
          <h1>{mode === "resetPassword" ? "Reset your password" : "Tender Cells account"}</h1>
          <p className={status.kind === "error" ? "account-error" : status.kind === "done" ? "account-notice" : "account-sub"}>{status.message}</p>
          {status.kind === "form" && (
            <form onSubmit={submit} className="account-form">
              <p className="account-sub">For {status.email}</p>
              <label>
                New password
                <input type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <button type="submit" className="btn-primary account-submit">Save password</button>
            </form>
          )}
          {status.kind !== "working" && status.kind !== "form" && (
            <div className="account-actions"><Link to="/account" className="btn-primary">Go to my account</Link></div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
