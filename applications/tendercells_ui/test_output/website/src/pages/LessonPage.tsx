// LessonPage — renders a lesson's markdown (from /public/lessons/<slug>.md).
// Images can be added later under /public/lessons/ and referenced from the md.
import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import PageLayout from "../components/PageLayout";
import { LESSONS, lessonBySlug } from "../data/lessons";
import { headingSlug, textOf } from "../lib/slug";

// Headings get GitHub-style ids so "#section" links in the lesson docs land on them; links
// inside the site stay in the SPA, links out (GitHub, datasheets) open in a new tab.
// Repo-relative links are rewritten when the lessons are synced (scripts/sync-lessons.mjs).
const heading = (Tag: "h1" | "h2" | "h3" | "h4") =>
  function Heading({ children }: { children?: ReactNode }) {
    return <Tag id={headingSlug(textOf(children))}>{children}</Tag>;
  };

const MD_COMPONENTS: Components = {
  h1: heading("h1"), h2: heading("h2"), h3: heading("h3"), h4: heading("h4"),
  a({ href = "", children }) {
    if (href.startsWith("/") && !href.startsWith("//") && !/\.(md|html|json|txt|xml)$/.test(href.split(/[?#]/)[0])) {
      return <Link to={href}>{children}</Link>;
    }
    if (/^https?:/.test(href)) return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
    return <a href={href}>{children}</a>;
  },
};

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
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{md}</ReactMarkdown>
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
