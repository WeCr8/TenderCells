// SchoolsPage.tsx - tendercells.com/schools: how a school signs up, what IT has to do for
// sign-in (school code -> the school's own Identity Platform tenant, see
// docs/SCHOOL_PLATFORM_OPERATIONS.md), how school accounts work (school-owned devices shared
// with classes) and a pilot sign-up form (saved to Firestore schoolInquiries, create-only).
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import { getDb } from "../lib/firestore";
import { auth } from "../lib/firebase";
import "./AccountPage.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined;
const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID as string | undefined;

const PLANS = [
  { name: "Starter (monthly)", detail: "30-day free trial - one teacher or homestead" },
  { name: "School (annual)", detail: "60-day free trial, purchase orders and invoices, school sign-in and roster sync" },
];

/** Providers a school can turn on. Each is configured on the school's own tenant; nothing shows until it is. */
const SSO_PROVIDERS = [
  { id: "google", label: "Google Workspace for Education", setup: "Mark Tender Cells as a Trusted app (steps below); we connect it to your school's tenant." },
  { id: "microsoft", label: "Microsoft 365 Education", setup: "A Global / Cloud Application Administrator accepts the admin consent link once." },
  { id: "clever", label: "Clever", setup: "Approve Tender Cells in your Clever district dashboard (OIDC); rosters sync from Clever." },
  { id: "classlink", label: "ClassLink", setup: "Add Tender Cells in ClassLink (OIDC or SAML); rosters sync with OneRoster." },
  { id: "saml", label: "Other district identity provider", setup: "Any SAML 2.0 IdP - send us your metadata URL." },
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
        <section className="account-card account-doc" style={{ maxWidth: 760 }}>
          <h2>How school accounts work</h2>
          <ul>
            <li><strong>The school owns its devices</strong> - the farm lab, garden beds, coops and robots belong to the school's organization, not to a student.</li>
            <li><strong>Classes decide access.</strong> School and district admins enroll devices and share each one with the classes that use it; teachers see their classes, students see only their class's devices.</li>
            <li><strong>Roles come from your roster</strong> (district admin, school admin, teacher, student) - verified on the server after sign-in, never chosen by the user.</li>
            <li><strong>Class robots run in student mode</strong>: the weeding laser only shows its aiming dot. Firing needs a teacher to switch student mode off on the robot, with every interlock closed.</li>
            <li><strong>Plans</strong>: {PLANS.map((p) => `${p.name} (${p.detail})`).join("; ")}.</li>
          </ul>

          <h2 id="sign-in">Sign-in (SSO)</h2>
          <p>
            Students and staff open <Link to="/account#school-sign-in">Sign in → School or district account</Link>, enter the school code
            we issue, and sign in with the provider your school turned on. Personal Google and email sign-in work for everyone today.
          </p>
          <table className="account-table">
            <thead><tr><th>Provider</th><th>Status</th><th>What is needed</th></tr></thead>
            <tbody>
              {SSO_PROVIDERS.map((p) => (
                <tr key={p.id}>
                  <td>{p.label}</td>
                  <td><span className="account-badge">Activated per school</span></td>
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
          <h3>Clever, ClassLink or another SAML provider</h3>
          <p>Tell us in the form which one your district uses; we register it on your school's tenant and send the details for your dashboard.</p>

          <h2 id="pilot">Start a school pilot</h2>
          <PilotForm />
          <div className="account-actions"><Link to="/account" className="btn-outline">Sign in</Link><Link to="/education" className="btn-outline">Curriculum</Link></div>
        </section>
      </div>
    </PageLayout>
  );
}
