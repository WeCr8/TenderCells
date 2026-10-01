// AccountPage.tsx - website-native sign-in, sign-up and account view (/account).
//
// The header "Login" used to link straight into the Tender Cells OS (/app), so
// signing in always launched the OS. This page lets people sign in, create an
// account and see their account on the website itself; the OS opens only from
// the explicit "Launch Tender Cells OS" button. Both share one Firebase session
// (same origin + project), so the OS opens already signed in.
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  OAuthProvider,
  SAMLAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { TENDERCELLS_OS_URL } from "../config/appLinks";
import { useAuthUser } from "../hooks/useAuthUser";
import { ACTION_CODE_SETTINGS, AUTH_CONFIGURED, app, auth } from "../lib/firebase";
import EmailPreferences from "./AccountSettings";
import "./AccountPage.css";

type Mode = "login" | "register";

interface SchoolLoginOption {
  kind: string;
  label: string;
  providerId: string;
  tenantId: string;
}

interface SchoolLoginOptions {
  organizationId: string;
  displayName: string;
  providers: SchoolLoginOption[];
}

const SCHOOL_REDIRECT_KEY = "tendercells_school_redirect";

interface SchoolRedirectState {
  organizationId: string;
  tenantId: string;
  providerId: string;
}

function readSchoolRedirect(): SchoolRedirectState | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(SCHOOL_REDIRECT_KEY) || "null") as Partial<SchoolRedirectState> | null;
    return value?.organizationId && value.tenantId && value.providerId ? value as SchoolRedirectState : null;
  } catch {
    return null;
  }
}

function SchoolSignIn() {
  const [organizationCode, setOrganizationCode] = useState("");
  const [options, setOptions] = useState<SchoolLoginOptions | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const findSchool = async () => {
    if (!app || !organizationCode.trim()) return;
    setBusy(true);
    setError("");
    try {
      const result = await httpsCallable<{ organizationCode: string }, SchoolLoginOptions>(getFunctions(app), "getSchoolLoginOptions")({
        organizationCode: organizationCode.trim().toUpperCase(),
      });
      setOptions(result.data);
      if (!result.data.providers.length) setError("This school has no active sign-in provider yet. Ask the district administrator.");
    } catch (reason) {
      setOptions(null);
      setError(reason instanceof Error ? reason.message : "School sign-in could not be loaded.");
    } finally {
      setBusy(false);
    }
  };

  const signInToSchool = async (provider: SchoolLoginOption) => {
    if (!app || !auth || !options) return;
    setBusy(true);
    setError("");
    auth.tenantId = provider.tenantId;
    const authProvider = provider.providerId === "google.com"
      ? new GoogleAuthProvider()
      : provider.providerId.startsWith("saml.")
        ? new SAMLAuthProvider(provider.providerId)
        : new OAuthProvider(provider.providerId);
    try {
      try {
        await signInWithPopup(auth, authProvider);
      } catch (reason) {
        const code = errorCode(reason);
        if (["auth/popup-blocked", "auth/cancelled-popup-request", "auth/operation-not-supported-in-this-environment"].includes(code)) {
          sessionStorage.setItem(SCHOOL_REDIRECT_KEY, JSON.stringify({
            organizationId: options.organizationId,
            tenantId: provider.tenantId,
            providerId: provider.providerId,
          } satisfies SchoolRedirectState));
          await signInWithRedirect(auth, authProvider);
          return;
        }
        throw reason;
      }
      await httpsCallable(getFunctions(app), "claimSchoolMembership")({ organizationId: options.organizationId });
      await auth.currentUser?.getIdToken(true);
      window.location.assign("/app/dashboard");
    } catch (reason) {
      auth.tenantId = null;
      setError(reason instanceof Error ? reason.message : "School sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="account-sso" id="school-sign-in">
      <summary className="account-sso-title">
        School or district account
      </summary>
      <label className="account-field">
        <span>School code</span>
        <input value={organizationCode} onChange={(event) => setOrganizationCode(event.target.value)} autoComplete="organization" placeholder="Provided by your school" />
      </label>
      <button type="button" className="btn-secondary account-submit" disabled={busy || !organizationCode.trim()} onClick={() => void findSchool()}>
        {busy ? "Checking..." : "Find my school"}
      </button>
      {options && <p className="account-hint"><strong>{options.displayName}</strong></p>}
      {options && <div className="account-sso-grid">
        {options.providers.map((provider) => (
          <button key={`${provider.tenantId}:${provider.providerId}`} type="button" className="account-sso-btn" disabled={busy}
            onClick={() => void signInToSchool(provider)}>
            <span>{provider.label}</span>
          </button>
        ))}
      </div>}
      {error && <p className="account-error" role="alert">{error}</p>}
      <p className="account-hint">
        Use the code issued by your school. Only district-configured providers appear, and roster access is verified after sign-in.
      </p>
    </details>
  );
}

function WorkspaceActions() {
  return (
    <div className="account-section">
      <h2>Workspace</h2>
      <div className="account-workspace-links">
        <a href="/app/dashboard">
          <strong>Open workspace</strong>
          <span>Continue to your dashboard and connected products.</span>
        </a>
        <a href="/app/products?register=1">
          <strong>Add or import a device</strong>
          <span>Start from a Tender Cells template, local file, or Hugging Face source.</span>
        </a>
        <a href="/app/account">
          <strong>Profile &amp; security</strong>
          <span>Update your name, verify email, reset your password, or prepare a fresh test workspace.</span>
        </a>
      </div>
      <p className="account-storage-note">
        Your sign-in is shared between the website and OS. Workspace products and settings are stored by the OS in this browser unless a connected service says otherwise.
      </p>
    </div>
  );
}

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

/** Site brand logo (same asset as the header), with the PNG as a fallback. */
function BrandLogo() {
  return (
    <Link to="/" className="account-logo" aria-label="Tender Cells home">
      <img
        src="/assets/images/tender-cells-logo.svg"
        alt="Tender Cells"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/assets/images/tender_cells_logo.png";
        }}
      />
    </Link>
  );
}

function AccountDetails({ user }: { user: User }) {
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const methods = user.providerData.map((p) => PROVIDER_LABELS[p.providerId] ?? p.providerId);
  const usesPassword = user.providerData.some((p) => p.providerId === "password");

  const handleVerify = async () => {
    setBusy(true);
    try {
      await sendEmailVerification(user, ACTION_CODE_SETTINGS);
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
      <BrandLogo />
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
        The OS opens with this account already signed in.
      </p>

      <WorkspaceActions />
      <EmailPreferences user={user} />
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
        void sendEmailVerification(cred.user, ACTION_CODE_SETTINGS).catch(() => undefined);
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
    auth.tenantId = null;
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
      await sendPasswordResetEmail(auth, email.trim(), ACTION_CODE_SETTINGS);
      setNotice(`If an account exists for ${email.trim()}, a reset link is on its way.`);
    } catch (err) {
      setError(describeAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="account-card" aria-labelledby="signin-title">
      <BrandLogo />
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

      <SchoolSignIn />

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

/** Same-site path to return to after sign-in (?next=/connect?...), or null. */
function safeNext(): string | null {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : null;
}

export default function AccountPage() {
  const { user, loading } = useAuthUser();
  const [redirectError, setRedirectError] = useState("");

  // Back to where sign-in was asked for (e.g. the AI assistant consent page).
  useEffect(() => {
    const next = safeNext();
    if (user && !loading && next) window.location.replace(next);
  }, [user, loading]);

  useEffect(() => {
    if (!app || !auth) return;
    // Narrow once, outside the closures below - `auth`'s declared type stays
    // possibly-undefined inside a nested arrow function even after this guard,
    // since TS control-flow narrowing of a mutable outer binding doesn't
    // persist into a deferred callback.
    const firebaseApp = app;
    const firebaseAuth = auth;
    const schoolRedirect = readSchoolRedirect();
    if (schoolRedirect) firebaseAuth.tenantId = schoolRedirect.tenantId;
    void getRedirectResult(firebaseAuth).then(async (result) => {
      if (!result?.user) return;
      if (!schoolRedirect) return;
      sessionStorage.removeItem(SCHOOL_REDIRECT_KEY);
      await httpsCallable(getFunctions(firebaseApp), "claimSchoolMembership")({ organizationId: schoolRedirect.organizationId });
      await result.user.getIdToken(true);
      window.location.assign("/app/dashboard");
    }).catch((reason) => {
      sessionStorage.removeItem(SCHOOL_REDIRECT_KEY);
      firebaseAuth.tenantId = null;
      setRedirectError(reason instanceof Error ? reason.message : "School sign-in could not be completed. Please try again.");
    });
  }, []);

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
      <div className="account-page">
        {redirectError && <p className="account-error" role="alert">{redirectError}</p>}
        {body}
      </div>
    </PageLayout>
  );
}
