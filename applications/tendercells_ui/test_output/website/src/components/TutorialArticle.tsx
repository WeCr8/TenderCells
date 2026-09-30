// TutorialArticle - a published lesson or doc (public/lessons, public/docs, generated from the
// repo by scripts/sync-docs.mjs) laid out like a rendered .md file and walked through as a
// tutorial:
//   - GitHub-style markdown typography (TutorialArticle.css, .md-body)
//   - "On this page" outline that follows the reader (sticky on desktop, a menu on phones)
//   - lessons: each "Step / Part / Stage / Level" heading can be marked done; progress is
//     kept in this browser (lib/progress.ts) and shown as a bar and in the outline
//   - copy buttons on code, callouts for safety / grown-up notes / key ideas / tips
// Links: site pages use the router, pages served separately (/flash, /viewer, /app, files)
// load normally, links off the site open a new tab. Headings get GitHub-style ids.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { headingSlug, textOf } from "../lib/slug";
import { CALLOUT_LABEL, calloutKind, readTutorial } from "../lib/tutorial";
import { getProgress, setProgress } from "../lib/progress";
import "./TutorialArticle.css";

/** Paths served outside this React app (static tools, the OS, files). */
const outsideApp = (path: string) => /^\/(flash|viewer|app|api)(\/|$)/.test(path) || /\.[a-z0-9]+$/i.test(path);

interface StepState { checkable: Set<string>; done: Set<string>; toggle: (id: string) => void }
const StepContext = createContext<StepState | null>(null);

function StepHeading({ Tag, children }: { Tag: "h2" | "h3" | "h4"; children?: ReactNode }) {
  const steps = useContext(StepContext);
  const text = textOf(children);
  const id = headingSlug(text);
  const checkable = !!steps?.checkable.has(id);
  const done = checkable && steps!.done.has(id);
  return (
    <Tag id={id} className={checkable ? `md-step${done ? " is-done" : ""}` : undefined}>
      <a href={`#${id}`} className="md-anchor" aria-hidden="true" tabIndex={-1}>#</a>
      <span className="md-heading-text">{children}</span>
      {checkable && (
        <button type="button" className="md-step-check" aria-pressed={done} onClick={() => steps!.toggle(id)}>
          {done ? "✓ Done" : "Mark done"}
        </button>
      )}
    </Tag>
  );
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(textOf(children).replace(/\n$/, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked - the reader can still select the text */ }
  };
  return (
    <div className="md-code">
      <button type="button" className="md-copy" onClick={() => void copy()}>{copied ? "Copied" : "Copy"}</button>
      <pre>{children}</pre>
    </div>
  );
}

const MD_COMPONENTS: Components = {
  h1: () => null, // the page header shows the title
  h2: ({ children }) => <StepHeading Tag="h2">{children}</StepHeading>,
  h3: ({ children }) => <StepHeading Tag="h3">{children}</StepHeading>,
  h4: ({ children }) => <StepHeading Tag="h4">{children}</StepHeading>,
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  table: ({ children }) => <div className="md-table"><table>{children}</table></div>,
  blockquote({ children }) {
    const kind = calloutKind(textOf(children));
    return (
      <aside className={`md-callout md-callout-${kind}`}>
        <div className="md-callout-label">{CALLOUT_LABEL[kind]}</div>
        {children}
      </aside>
    );
  },
  a({ href = "", children }) {
    if (href.startsWith("/") && !href.startsWith("//") && !outsideApp(href.split(/[?#]/)[0])) {
      return <Link to={href}>{children}</Link>;
    }
    if (/^https?:/.test(href)) return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
    return <a href={href}>{children}</a>;
  },
  img: ({ src, alt }) => <img src={src} alt={alt ?? ""} loading="lazy" />,
};

/** The heading currently at the top of the reading area. */
function useActiveHeading(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let current: string | null = ids[0] ?? null;
        for (const id of ids) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= 140) current = id;
        }
        setActive(current);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); };
  }, [ids]);
  return active;
}

interface Props {
  md: string;
  /** Lessons: steps can be marked done, remembered under this key. Docs: omit. */
  progressKey?: string;
  /** Breadcrumb, shown above the title. */
  crumbs?: ReactNode;
  /** Chips next to the reading time (e.g. the lesson level). */
  meta?: ReactNode;
  /** Shown under the article (prev / next). */
  footer?: ReactNode;
}

export default function TutorialArticle({ md, progressKey, crumbs, meta, footer }: Props) {
  const tutorial = useMemo(() => readTutorial(md), [md]);
  const { outline } = tutorial;
  // Checkable steps: step-like headings; a lesson without any walks through its sections.
  const stepIds = useMemo(() => {
    if (!progressKey) return [];
    const steps = outline.filter((o) => o.step);
    return (steps.length ? steps : outline.filter((o) => o.level === 2)).map((o) => o.id);
  }, [outline, progressKey]);

  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!progressKey) return;
    const saved = getProgress(progressKey);
    setDone(new Set(saved.done.filter((id) => stepIds.includes(id))));
    setProgress(progressKey, { done: saved.done.filter((id) => stepIds.includes(id)), total: stepIds.length });
  }, [progressKey, stepIds]);

  const toggle = useCallback((id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      if (progressKey) setProgress(progressKey, { done: [...next], total: stepIds.length });
      return next;
    });
  }, [progressKey, stepIds.length]);

  const steps = useMemo<StepState>(() => ({ checkable: new Set(stepIds), done, toggle }), [stepIds, done, toggle]);
  const ids = useMemo(() => outline.map((o) => o.id), [outline]);
  const active = useActiveHeading(ids);
  const nextStep = stepIds.find((id) => !done.has(id));
  const complete = stepIds.length > 0 && !nextStep;

  const toc = (
    <ol className="tut-toc-list">
      {outline.map((o) => (
        <li key={o.id} className={`lvl-${o.level}${active === o.id ? " is-active" : ""}${done.has(o.id) ? " is-done" : ""}`}>
          <a href={`#${o.id}`}>
            {steps.checkable.has(o.id) && <span className="tut-toc-check" aria-hidden="true">{done.has(o.id) ? "✓" : "○"}</span>}
            {o.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="tut">
      <header className="tut-head">
        {crumbs && <p className="tut-crumbs">{crumbs}</p>}
        {tutorial.title && <h1 className="tut-title">{tutorial.title}</h1>}
        <div className="tut-meta">
          <span>⏱ {tutorial.minutes} min read</span>
          {stepIds.length > 0 && <span>🪜 {stepIds.length} steps</span>}
          {meta}
        </div>
        {stepIds.length > 0 && (
          <div className="tut-progress" aria-live="polite">
            <div className="tut-progress-bar"><span style={{ width: `${(done.size / stepIds.length) * 100}%` }} /></div>
            <span className="tut-progress-text">
              {complete ? "All steps done - nice work! 🏆" : `${done.size} of ${stepIds.length} steps done`}
            </span>
            {nextStep && <a className="tut-progress-next" href={`#${nextStep}`}>{done.size ? "Continue →" : "Start →"}</a>}
            {done.size > 0 && (
              <button type="button" className="tut-progress-reset" onClick={() => { setDone(new Set()); if (progressKey) setProgress(progressKey, { done: [], total: stepIds.length }); }}>
                Reset
              </button>
            )}
          </div>
        )}
      </header>

      <div className="tut-grid">
        {outline.length > 1 && (
          <>
            <details className="tut-toc-mobile">
              <summary>On this page{stepIds.length ? ` · ${done.size}/${stepIds.length} done` : ""}</summary>
              {toc}
            </details>
            <nav className="tut-toc" aria-label="On this page">
              <p className="tut-toc-title">On this page</p>
              {toc}
            </nav>
          </>
        )}
        <div className="tut-main">
          <StepContext.Provider value={steps}>
            <article className="md-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{md}</ReactMarkdown>
            </article>
          </StepContext.Provider>
          {footer}
        </div>
      </div>
    </div>
  );
}

