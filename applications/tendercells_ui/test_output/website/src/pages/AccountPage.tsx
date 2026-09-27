// AccountPage.tsx - website-native sign-in, sign-up and account view (/account).
//
// The header "Login" used to link straight into the Tender Cells OS (/app), so
// signing in always launched the OS. This page lets people sign in, create an
// account and see their account on the website itself; the OS opens only from
// the explicit "Launch Tender Cells OS" button. Both share one Firebase session
// (same origin + project), so the OS opens already signed in.
import { useState, type FormEvent, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import PageLayout from "../components/PageLayout";
import { TENDERCELLS_OS_URL } from "../config/appLinks";
import { useAuthUser } from "../hooks/useAuthUser";
import { AUTH_CONFIGURED, auth } from "../lib/firebase";
import "./AccountPage.css";

type Mode = "login" | "register";

function errorCode(err: unknown): string {
  return typeof err === "object" && err && "code" in err ? String((err as { code?: unknown }).code) : "";
}

/** Plain-language text for Firebase Auth error codes. */
function describeAuthError(err: unknown): string {
  switch (errorCode(err)) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "The email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Log in instead.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again, or reset your password.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before it finished.";
    case "auth/unauthorized-domain":
      return "This site is not authorized for Tender Cells sign-in yet.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled for Tender Cells.";
    case "auth/network-request-failed":
    case "auth/internal-error":
      return "Could not reach Tender Cells sign-in. Check your connection and try again.";
    default:
      return err instanceof Error ? err.message : "Sign-in failed. Please try again.";
  }
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

const PROVIDER_LABELS: Record<string, string> = {
  password: "Email & password",
  "google.com": "Google",
};

function AccountDetails({ user }: { user: User }) {
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const methods = user.providerData.map((p) => PROVIDER_LABELS[p.providerId] ?? p.providerId);
  const usesPassword = user.providerData.some((p) => p.providerId === "password");

  const handleVerify = async () => {
    setBusy(true);
    try {
      await sendEmailVerification(user);
      setNotice(`Verification email sent to ${user.email}.`);
    } catch (err) {
      setNotice(describeAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    setBusy(true);
    try {
      await signOut(auth);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="account-card" aria-labelledby="account-title">
      <div className="account-identity">
        {user.photoURL ? (
          <img className="account-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="account-avatar account-avatar-fallback" aria-hidden="true">
            {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <h1 id="account-title">{user.displayName || "Your account"}</h1>
          <p className="account-email">{user.email}</p>
        </div>
      </div>

      <dl className="account-facts">
        <div>
          <dt>Sign-in method</dt>
          <dd>{methods.join(", ") || "—"}</dd>
        </div>
        <div>
          <dt>Email verified</dt>
          <dd>{user.emailVerified ? "Yes" : "Not yet"}</dd>
        </div>
        <div>
          <dt>Member since</dt>
          <dd>{formatDate(user.metadata.creationTime)}</dd>
        </div>
        <div>
          <dt>Last sign-in</dt>
          <dd>{formatDate(user.metadata.lastSignInTime)}</dd>
        </div>
      </dl>

      {notice && <p className="account-notice" role="status">{notice}</p>}

      <div className="account-actions">
        <a href={TENDERCELLS_OS_URL} className="btn-primary">Launch Tender Cells OS</a>
        {usesPassword && !user.emailVerified && (
          <button type="button" className="btn-outline" onClick={handleVerify} disabled={busy}>
            Send verification email
          </button>
        )}
        <button type="button" className="btn-outline" onClick={handleSignOut} disabled={busy}>
          Sign out
        </button>
      </div>
      <p className="account-hint">
        The OS opens with this account already signed in. Your devices, flocks and schedules live there.
      </p>
    </section>
  );
}

function SignInForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        // Best effort - the account works without it; the Account view offers a resend.
        void sendEmailVerification(cred.user).catch(() => undefined);
      }
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    if (!auth) return;
    setBusy(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const code = errorCode(err);
      if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request" || code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, provider);
        return;
      }
      setError(describeAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!auth) return;
    if (!email.trim()) {
      setError("Enter your email above, then choose “Forgot password?” again.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice(`If an account exists for ${email.trim()}, a reset link is on its way.`);
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="account-card" aria-labelledby="signin-title">
      <h1 id="signin-title">{mode === "login" ? "Log in to Tender Cells" : "Create your Tender Cells account"}</h1>
      <p className="account-sub">
        One account for the website and the Tender Cells OS.
      </p>

      <div className="account-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>
          Log in
        </button>
        <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>
          Create account
        </button>
      </div>

      {error && <p className="account-error" role="alert">{error}</p>}
      {notice && <p className="account-notice" role="status">{notice}</p>}

      <button type="button" className="account-google" onClick={handleGoogle} disabled={busy}>
        <span aria-hidden="true" className="account-google-g">G</span> Continue with Google
      </button>

      <div className="account-divider"><span>or use email</span></div>

      <form onSubmit={handleSubmit} className="account-form">
        <label>
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" className="btn-primary account-submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      {mode === "login" && (
        <button type="button" className="account-link" onClick={handleReset} disabled={busy}>
          Forgot password?
        </button>
      )}
    </section>
  );
}

export default function AccountPage() {
  const { user, loading } = useAuthUser();

  let body: ReactNode;
  if (!AUTH_CONFIGURED) {
    body = (
      <section className="account-card">
        <h1>Sign-in unavailable</h1>
        <p className="account-error" role="alert">
          This build of the website was published without Firebase configuration.
        </p>
      </section>
    );
  } else if (loading) {
    body = <section className="account-card"><p className="account-sub">Checking your sign-in…</p></section>;
  } else if (user) {
    body = <AccountDetails user={user} />;
  } else {
    body = <SignInForm />;
  }

  return (
    <PageLayout>
      <div className="account-page">{body}</div>
    </PageLayout>
  );
}
