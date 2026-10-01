// ConnectPage.tsx - /connect: the consent screen for connecting an AI assistant (Claude,
// ChatGPT) to a Tender Cells account. The assistant's OAuth request lands here via
// /oauth/authorize?...; the person signs in (if needed), sees who is asking and what it
// can do (read-only farm data), and approves or declines. Approval posts a fresh Firebase
// ID token to /oauth/approve, which returns the redirect back to the assistant.
// Usage: reached only from the hosted connector's OAuth flow (?request=<id>).
import { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import { useAuthUser } from "../hooks/useAuthUser";
import { AUTH_CONFIGURED } from "../lib/firebase";
import "./AccountPage.css";

interface RequestInfo {
  clientName: string;
  redirectHost: string;
  scope: string;
}

const CAN = [
  "See your devices and their latest readings (temperature, humidity, ammonia, feed, water, headcount, door)",
  "See device state, whether it is online, and recent predator / fault / health alerts",
];
const CANNOT = [
  "Open or close doors, feed, switch relays, move robots or stop or clear an E-STOP - the cloud connector is read-only",
  "See your password, payment details, or other people's devices",
];

export default function ConnectPage() {
  const { user, loading } = useAuthUser();
  const requestId = new URLSearchParams(window.location.search).get("request") ?? "";
  const [info, setInfo] = useState<RequestInfo | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!requestId) { setError("This page opens from your assistant's \"Connect\" button. Start there."); return; }
    fetch(`/oauth/request/${encodeURIComponent(requestId)}`)
      .then(async (r) => {
        const body = await r.json() as RequestInfo & { error?: string };
        if (!r.ok) throw new Error(body.error ?? "This request could not be found.");
        setInfo(body);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "This request could not be found."));
  }, [requestId]);

  const decide = async (approve: boolean) => {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const idToken = await user.getIdToken(true);
      const r = await fetch("/oauth/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: requestId, idToken, approve }),
      });
      const body = await r.json() as { redirect?: string; error?: string };
      if (!r.ok || !body.redirect) throw new Error(body.error ?? "Could not finish connecting. Try again from your assistant.");
      window.location.assign(body.redirect);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not finish connecting.");
      setBusy(false);
    }
  };

  const next = `/connect?request=${encodeURIComponent(requestId)}`;
  return (
    <PageLayout>
      <div className="account-page">
        <section className="account-card connect-card" aria-labelledby="connect-title">
          <img src="/brand/tendercells-icon-128.png" alt="" width={64} height={64} className="connect-logo" />
          <h1 id="connect-title">{info ? `Connect ${info.clientName} to Tender Cells` : "Connect an AI assistant"}</h1>
          {info && <p className="account-sub">Requested by <strong>{info.redirectHost}</strong>. You can disconnect at any time from that app.</p>}
          {error && <p className="account-error" role="alert">{error}</p>}

          {info && (
            <>
              <h2 className="connect-h2">It will be able to</h2>
              <ul className="connect-list connect-can">{CAN.map((c) => <li key={c}>{c}</li>)}</ul>
              <h2 className="connect-h2">It will not be able to</h2>
              <ul className="connect-list connect-cannot">{CANNOT.map((c) => <li key={c}>{c}</li>)}</ul>

              {!AUTH_CONFIGURED ? (
                <p className="account-error" role="alert">Sign-in is unavailable on this build of the site.</p>
              ) : loading ? (
                <p className="account-sub">Checking your sign-in…</p>
              ) : !user ? (
                <div className="account-actions">
                  <a className="btn-primary" href={`/account?next=${encodeURIComponent(next)}`}>Sign in to continue</a>
                </div>
              ) : (
                <>
                  <p className="account-hint">Signed in as <strong>{user.email ?? user.displayName ?? "your account"}</strong>.</p>
                  <div className="account-actions">
                    <button type="button" className="btn-primary" disabled={busy} onClick={() => void decide(true)}>Allow read-only access</button>
                    <button type="button" className="btn-outline" disabled={busy} onClick={() => void decide(false)}>Cancel</button>
                  </div>
                </>
              )}
              <p className="account-hint">
                Only devices on your account that your hub has synced are visible.
                Read the <a href="/privacy">privacy policy</a> and the <a href="/docs/ai-assistant-plugin">connector guide</a>.
              </p>
            </>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
