// SchoolsPage.tsx - tendercells.com/schools: how a school signs up, what IT has to do for
// sign-in, how school accounts work (org-owned property + products, class access), and
// a pilot sign-up form (saved to Firestore schoolInquiries, create-only).
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import { getDb } from "../lib/firestore";
import { auth } from "../lib/firebase";
import { SSO_PROVIDERS } from "../lib/sso";
import "./AccountPage.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined;
const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID as string | undefined;

const PLANS = [
  { name: "Classroom", detail: "1 property, up to 10 products, 3 classes, 40 seats" },
  { name: "School", detail: "3 properties, up to 40 products, 30 classes, 600 seats" },
  { name: "District", detail: "Properties per school, district-wide SSO and roster sync" },
];

function PilotForm() {
  const [form, setForm] = useState({ school: "", district: "", contactName: "", email: "", role: "teacher", students: "", sso: "google", notes: "" });
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState("busy");
    try {
      const [{ addDoc, collection, serverTimestamp }, db] = await Promise.all([import("firebase/firestore"), getDb()]);
      const uid = auth?.currentUser?.uid;
      await addDoc(collection(db, "schoolInquiries"), {
        ...form, school: form.school.trim(), email: form.email.trim().toLowerCase(), notes: form.notes.slice(0, 2000),
        createdAt: serverTimestamp(), ...(uid ? { uid } : {}),
      });
      setState("sent");
    } catch {
      setState("error");
    }
  };
  if (state === "sent") return <p className="account-notice" role="status">Thanks! We will email {form.email} to set up your school.</p>;
  return (
    <form className="account-form" onSubmit={submit} data-testid="school-pilot-form">
      <label>School name<input required maxLength={200} value={form.school} onChange={set("school")} /></label>
      <label>District (optional)<input maxLength={200} value={form.district} onChange={set("district")} /></label>
      <label>Your name<input required maxLength={120} value={form.contactName} onChange={set("contactName")} /></label>
      <label>School email<input required type="email" value={form.email} onChange={set("email")} /></label>
      <label>Your role
        <select value={form.role} onChange={set("role")}>
          <option value="teacher">Teacher</option><option value="it">IT admin</option>
          <option value="admin">School / district administrator</option><option value="other">Other</option>
        </select>
      </label>
      <label>About how many students?<input inputMode="numeric" maxLength={10} value={form.students} onChange={set("students")} /></label>
      <label>Students sign in with
        <select value={form.sso} onChange={set("sso")}>
          <option value="google">Google Workspace for Education</option><option value="microsoft">Microsoft 365</option>
          <option value="clever">Clever</option><option value="classlink">ClassLink</option><option value="other">Other / not sure</option>
        </select>
      </label>
      <label>Anything else? (optional)<textarea maxLength={2000} rows={3} value={form.notes} onChange={set("notes")} /></label>
      <button type="submit" className="btn-primary account-submit" disabled={state === "busy"}>Request a school pilot</button>
      {state === "error" && <p className="account-error" role="alert">Could not send right now - email us instead.</p>}
    </form>
  );
}

export default function SchoolsPage() {
  const consentUrl = MICROSOFT_CLIENT_ID
    ? `https://login.microsoftonline.com/organizations/adminconsent?client_id=${encodeURIComponent(MICROSOFT_CLIENT_ID)}`
    : null;
  return (
    <PageLayout>
      <PageHero kicker="For schools" title="Tender Cells for schools" subtitle="Your school owns its farm lab, garden and robots. Teachers choose what each class can see and run; students sign in with their school account." />
      <div className="account-page" style={{ alignItems: "flex-start" }}>
        <section className="account-card" style={{ maxWidth: 760 }}>
          <h2>How school accounts work</h2>
          <ul>
            <li><strong>The school owns the property and products</strong> - the farm lab, garden beds, coops and robots. A district can hold shared ones too.</li>
            <li><strong>Classes decide access.</strong> Each class gets the properties and products it needs, plus what students may do: view the map, watch cameras, run routines, aim the weeding laser.</li>
            <li><strong>Students never get their own property</strong>, and never fire a laser - only teachers can, with every safety interlock in place.</li>
            <li><strong>Plans</strong>: {PLANS.map((p) => `${p.name} (${p.detail})`).join("; ")}.</li>
          </ul>

          <h2 id="sign-in">Sign-in (SSO) - what works today</h2>
          <table className="account-table">
            <thead><tr><th>Provider</th><th>Status</th><th>What is needed</th></tr></thead>
            <tbody>
              {SSO_PROVIDERS.map((p) => (
                <tr key={p.id}>
                  <td>{p.label}</td>
                  <td>{p.status === "available" ? <span className="account-badge">Available</span> : <span className="account-soon">Coming soon</span>}</td>
                  <td>{p.setup}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 id="it-setup">For IT admins</h2>
          <h3>Google Workspace for Education</h3>
          <ol>
            <li>Admin console → <strong>Security → Access and data control → API controls</strong> → <strong>Manage Third-Party App Access</strong>.</li>
            <li><strong>Add app → OAuth App Name or Client ID</strong>, search for {GOOGLE_CLIENT_ID ? <>client ID <code>{GOOGLE_CLIENT_ID}</code></> : <>“Tender Cells” (we send you the client ID with your pilot)</>}.</li>
            <li>Choose the organizational units (students, teachers) and set access to <strong>Trusted</strong>.</li>
          </ol>
          <p className="account-hint">
            Why: accounts designated as under 18 are blocked from any third-party app the admin has not configured.
            Tender Cells only asks for basic sign-in (name, email, profile picture) - no Drive, Gmail or Classroom access.
            Your school is responsible for any parental consent your policies require.
          </p>
          <h3>Microsoft 365</h3>
          <ol>
            <li>{consentUrl ? <>Open the <a href={consentUrl} rel="noopener noreferrer">admin consent link</a> as a Global / Cloud Application Administrator and accept.</> : <>We send an admin consent link with your pilot; a Global or Cloud Application Administrator accepts it once.</>}</li>
            <li>Students and teachers then use <strong>School or district account → Microsoft 365</strong> on the sign-in page.</li>
          </ol>
          <h3>Clever and ClassLink</h3>
          <p>Planned - tell us in the form if your district uses them so we prioritise the connection.</p>

          <h2 id="pilot">Start a school pilot</h2>
          <PilotForm />
          <div className="account-actions"><Link to="/account" className="btn-outline">Sign in</Link><Link to="/education" className="btn-outline">Curriculum</Link></div>
        </section>
      </div>
    </PageLayout>
  );
}
