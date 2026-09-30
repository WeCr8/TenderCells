// LessonsPage - the hands-on lessons as one learning path: pick where to start, then follow
// the numbered path. Each lesson shows how far you got (steps marked done in that lesson,
// remembered in this browser).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import { LESSONS } from "../data/lessons";
import { getProgress, type LessonProgress } from "../lib/progress";
import "./LessonsPage.css";

const START_HERE = [
  { who: "Kids & first-timers (7+)", slug: "your-first-coop-brain", why: "Flash a board and watch it wake up." },
  { who: "Teachers & clubs", slug: "classroom-quickstart", why: "Run a simulated coop on a laptop in 5 minutes." },
  { who: "Makers", slug: "door-roaming-roost", why: "Wire a servo door and drive a rover from the OS." },
  { who: "Advanced", slug: "gantry-bom", why: "Build an XY gantry with real parts lists." },
];

function status(p: LessonProgress | undefined): { label: string; cls: string; pct: number } {
  if (!p || !p.total || !p.done.length) return { label: "Start", cls: "is-new", pct: 0 };
  if (p.done.length >= p.total) return { label: "Done ✓", cls: "is-done", pct: 100 };
  return { label: `Continue · ${p.done.length}/${p.total}`, cls: "is-going", pct: (p.done.length / p.total) * 100 };
}

export default function LessonsPage() {
  const [progress, setProgressMap] = useState<Record<string, LessonProgress>>({});
  useEffect(() => {
    setProgressMap(Object.fromEntries(LESSONS.map((l) => [l.slug, getProgress(l.slug)])));
  }, []);
  const path = LESSONS.filter((l) => l.tag !== "Map");
  const map = LESSONS.find((l) => l.tag === "Map");

  return (
    <PageLayout>
      <PageHero
        gradient="linear-gradient(135deg, #4A7C59 0%, #0D2B1E 100%)"
        title="Hands-on Lessons"
        subtitle="Step-by-step walkthroughs, LEGO-style. Mark each step done as you go - your progress is saved in this browser."
      />

      <section className="lp-start" aria-labelledby="lp-start-title">
        <h2 id="lp-start-title">Where do you start?</h2>
        <div className="lp-start-grid">
          {START_HERE.map((s) => {
            const lesson = LESSONS.find((l) => l.slug === s.slug);
            return lesson ? (
              <Link key={s.slug} to={`/lessons/${s.slug}`} className="lp-start-card">
                <span className="lp-start-who">{s.who}</span>
                <strong>{lesson.title}</strong>
                <span>{s.why}</span>
              </Link>
            ) : null;
          })}
        </div>
      </section>

      <section aria-labelledby="lp-path-title">
        <h2 id="lp-path-title" className="lp-h2">The learning path</h2>
        <ol className="lp-path">
          {path.map((l, i) => {
            const st = status(progress[l.slug]);
            return (
              <li key={l.slug} className={`lp-step ${st.cls}`}>
                <span className="lp-num" aria-hidden="true">{st.cls === "is-done" ? "✓" : i + 1}</span>
                <Link to={`/lessons/${l.slug}`} className="lp-card">
                  <div className="lp-card-top">
                    <h3>{l.title}</h3>
                    <span className="tag">{l.tag}</span>
                  </div>
                  <p>{l.desc}</p>
                  <div className="lp-card-foot">
                    <div className="lp-bar"><span style={{ width: `${st.pct}%` }} /></div>
                    <span className="lp-cta">{st.label} →</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {map && (
        <div className="lp-map">
          <div>
            <h3>{map.title}</h3>
            <p>{map.desc}</p>
          </div>
          <Link to={`/lessons/${map.slug}`} className="btn-primary">Open the map →</Link>
        </div>
      )}

      <div className="cta-bar" style={{ marginTop: "1.5rem" }}>
        <a href="/flash" className="btn-primary">⚡ Flash a device</a>
        <Link to="/docs" className="btn-outline">📘 Build guides &amp; docs</Link>
        <a href="/viewer" className="btn-outline">🧊 3D Model Viewer</a>
      </div>
    </PageLayout>
  );
}
