// NewsletterSignup.tsx - one-field newsletter sign-up for the footer (double opt-in).
import { useState, type FormEvent } from "react";

/** Compact footer form; the full form with topics lives at /newsletter. */
export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState("busy");
    try {
      const { requestNewsletter } = await import("../lib/newsletter");
      await requestNewsletter(email, ["news"], "footer");
      setState("sent");
    } catch {
      setState("error");
    }
  };
  return (
    <form className="footer-newsletter" onSubmit={submit} aria-label="Newsletter sign-up">
      <label htmlFor="footer-email">Newsletter</label>
      {state === "sent" ? (
        <p role="status">Check your inbox to confirm.</p>
      ) : (
        <div>
          <input id="footer-email" type="email" required placeholder="you@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <button type="submit" disabled={state === "busy"}>Subscribe</button>
        </div>
      )}
      {state === "error" && <p role="alert">Could not sign up right now.</p>}
    </form>
  );
}
