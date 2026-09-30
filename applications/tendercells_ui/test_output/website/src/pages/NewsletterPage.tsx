// NewsletterPage.tsx - /newsletter (sign up), /newsletter/confirm and /newsletter/unsubscribe.
//
// Double opt-in: signing up writes newsletterSignups/{id}; the onNewsletterSignup Cloud
// Function emails a confirmation link; only confirmed addresses are subscribed.
// Signed-in users can also toggle the newsletter in Account → Email preferences.
import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { callFunction } from "../lib/firestore";
import { NEWSLETTER_TOPICS, requestNewsletter } from "../lib/newsletter";
import "./AccountPage.css";

function SignupForm() {
  const [email, setEmail] = useState("");
  const [topics, setTopics] = useState<string[]>(["news"]);
  const [state, setState] = useState<{ kind: "idle" | "busy" | "sent" | "error"; msg?: string }>({ kind: "idle" });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState({ kind: "busy" });
    try {
      await requestNewsletter(email, topics, "newsletter-page");
      setState({ kind: "sent", msg: `Check ${email} for a confirmation link.` });
    } catch {
      setState({ kind: "error", msg: "Could not sign you up right now. Please try again." });
    }
  };
  return (
    <form onSubmit={submit} className="account-form">
      <label>
        Email
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <fieldset className="account-topics">
        <legend>What would you like?</legend>
        {NEWSLETTER_TOPICS.map((t) => (
          <label key={t.id} className="account-check">
            <input type="checkbox" checked={topics.includes(t.id)}
              onChange={(e) => setTopics(e.target.checked ? [...topics, t.id] : topics.filter((x) => x !== t.id))} />
            {t.label}
          </label>
        ))}
      </fieldset>
      <button type="submit" className="btn-primary account-submit" disabled={state.kind === "busy" || !topics.length}>Subscribe</button>
      {state.msg && <p className={state.kind === "error" ? "account-error" : "account-notice"} role="status">{state.msg}</p>}
      <p className="account-hint">We send a confirmation email first. Unsubscribe from any email in one click.</p>
    </form>
  );
}

function ResultAction({ mode }: { mode: "confirm" | "unsubscribe" }) {
  const [params] = useSearchParams();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    const call = mode === "confirm"
      ? callFunction<{ ok: boolean }>("confirmNewsletter", { id: params.get("id"), token: params.get("token") })
      : callFunction<{ ok: boolean }>("unsubscribeNewsletter", { email: params.get("email"), token: params.get("token") });
    call.then(() => setMsg({ ok: true, text: mode === "confirm" ? "You're subscribed - thanks!" : "You're unsubscribed. Sorry to see you go." }))
      .catch((err: Error) => setMsg({ ok: false, text: err.message || "That link did not work." }));
  }, [mode, params]);
  return <p className={msg?.ok === false ? "account-error" : "account-notice"} role="status">{msg?.text ?? "One moment…"}</p>;
}

export default function NewsletterPage({ mode = "signup" }: { mode?: "signup" | "confirm" | "unsubscribe" }) {
  return (
    <PageLayout>
      <div className="account-page">
        <section className="account-card">
          <h1>Tender Cells newsletter</h1>
          {mode === "signup" ? <SignupForm /> : <ResultAction mode={mode} />}
          <div className="account-actions"><Link to="/" className="btn-outline">Back to Tender Cells</Link></div>
        </section>
      </div>
    </PageLayout>
  );
}
