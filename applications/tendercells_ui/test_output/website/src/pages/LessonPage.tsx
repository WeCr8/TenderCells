// LessonPage — renders a lesson's markdown (from /public/lessons/<slug>.md).
// Images can be added later under /public/lessons/ and referenced from the md.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PageLayout from "../components/PageLayout";
import { LESSONS, lessonBySlug } from "../data/lessons";

export default function LessonPage() {
  const { slug = "" } = useParams();
  const meta = lessonBySlug(slug);
  const [md, setMd] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    setMd(null);
    setErr(false);
    fetch(`/lessons/${slug}.md`)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then(setMd)
      .catch(() => setErr(true));
  }, [slug]);

  const idx = LESSONS.findIndex((l) => l.slug === slug);
  const prev = idx > 0 ? LESSONS[idx - 1] : null;
  const next = idx >= 0 && idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null;

  return (
    <PageLayout>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "1.5rem 1rem" }}>
        {/* Breadcrumb — never a dead end */}
        <p style={{ fontSize: ".9rem", marginBottom: "1rem" }}>
          <Link to="/">Home</Link> › <Link to="/lessons">Lessons</Link>
          {meta ? ` › ${meta.title}` : ""}
        </p>

        {err && (
          <div className="prose">
            <h2>Lesson not found</h2>
            <p>That lesson isn't here. Back to <Link to="/lessons">all lessons</Link>.</p>
          </div>
        )}
        {!err && !md && <p>Loading lesson…</p>}
        {md && (
          <article className="prose lesson-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
          </article>
        )}

        {/* Prev / Next path */}
        <div className="cta-bar" style={{ marginTop: "2rem", justifyContent: "space-between" }}>
          {prev ? <Link to={`/lessons/${prev.slug}`} className="btn-outline">← {prev.title}</Link> : <span />}
          {next ? <Link to={`/lessons/${next.slug}`} className="btn-primary">{next.title} →</Link>
                : <Link to="/lessons" className="btn-primary">All lessons →</Link>}
        </div>
      </div>
    </PageLayout>
  );
}
