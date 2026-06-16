// LessonsPage — in-site index of all hands-on lessons (no dead ends).
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import { LESSONS } from "../data/lessons";

export default function LessonsPage() {
  return (
    <PageLayout>
      <PageHero
        gradient="linear-gradient(135deg, #4A7C59 0%, #0D2B1E 100%)"
        title="Hands-on Lessons"
        subtitle="LEGO-style, step-by-step builds for ages 7+. Start at the top and follow the path."
      />
      <div className="card-grid">
        {LESSONS.map((l) => (
          <Link key={l.slug} to={`/lessons/${l.slug}`} className="card"
            style={{ textDecoration: "none", color: "inherit" }}>
            <h3>{l.title}</h3>
            <p>{l.desc}</p>
            <span className="tag">{l.tag}</span>
          </Link>
        ))}
      </div>
      <div className="cta-bar" style={{ marginTop: "1.5rem" }}>
        <a href="/flash" className="btn-primary">⚡ Flash a device</a>
        <a href="/viewer" className="btn-outline">🧊 3D Model Viewer</a>
      </div>
    </PageLayout>
  );
}
