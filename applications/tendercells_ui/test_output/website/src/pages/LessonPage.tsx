// LessonPage - one hands-on lesson as a tutorial walkthrough (public/lessons/<slug>.md,
// generated from the repo docs by scripts/sync-docs.mjs): outline, steps to mark done,
// progress remembered in this browser, previous / next lesson.
import { Link, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import TutorialArticle from "../components/TutorialArticle";
import { useMarkdown } from "../hooks/useMarkdown";
import { LESSONS, lessonBySlug } from "../data/lessons";

export default function LessonPage() {
  const { slug = "" } = useParams();
  const meta = lessonBySlug(slug);
  const md = useMarkdown(`/lessons/${slug}.md`);

  const idx = LESSONS.findIndex((l) => l.slug === slug);
  const prev = idx > 0 ? LESSONS[idx - 1] : null;
  const next = idx >= 0 && idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null;
  const crumbs = <><Link to="/">Home</Link> › <Link to="/lessons">Lessons</Link>{meta ? ` › ${meta.title}` : ""}</>;

  return (
    <PageLayout>
      {md === false && (
        <div className="tut">
          <p className="tut-crumbs">{crumbs}</p>
          <div className="prose">
            <h2>Lesson not found</h2>
            <p>That lesson isn't here. Back to <Link to="/lessons">all lessons</Link>.</p>
          </div>
        </div>
      )}
      {md === null && <div className="tut"><p className="tut-crumbs">{crumbs}</p><p>Loading lesson…</p></div>}
      {md && (
        <TutorialArticle
          md={md}
          progressKey={slug}
          crumbs={crumbs}
          meta={meta && <>
            <span className="tag">{meta.tag}</span>
            {idx >= 0 && <span>Lesson {idx + 1} of {LESSONS.length}</span>}
          </>}
          footer={
            <div className="tut-footer cta-bar" style={{ justifyContent: "space-between" }}>
              {prev ? <Link to={`/lessons/${prev.slug}`} className="btn-outline">← {prev.title}</Link> : <Link to="/lessons" className="btn-outline">← All lessons</Link>}
              {next ? <Link to={`/lessons/${next.slug}`} className="btn-primary">Next: {next.title} →</Link>
                    : <Link to="/lessons" className="btn-primary">All lessons →</Link>}
            </div>
          }
        />
      )}
    </PageLayout>
  );
}
