// LessonPage — renders a lesson's markdown (public/lessons/<slug>.md, generated from the
// repo docs by scripts/sync-docs.mjs).
import { Link, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import MarkdownArticle from "../components/MarkdownArticle";
import { useMarkdown } from "../hooks/useMarkdown";
import { LESSONS, lessonBySlug } from "../data/lessons";

export default function LessonPage() {
  const { slug = "" } = useParams();
  const meta = lessonBySlug(slug);
  const md = useMarkdown(`/lessons/${slug}.md`);

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

        {md === false && (
          <div className="prose">
            <h2>Lesson not found</h2>
            <p>That lesson isn't here. Back to <Link to="/lessons">all lessons</Link>.</p>
          </div>
        )}
        {md === null && <p>Loading lesson…</p>}
        {md && <MarkdownArticle md={md} className="lesson-body" />}

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
