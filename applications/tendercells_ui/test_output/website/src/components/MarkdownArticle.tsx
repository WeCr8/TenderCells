// MarkdownArticle - renders a published lesson or doc (public/lessons, public/docs), which
// scripts/sync-docs.mjs generates from the repo. Headings get GitHub-style ids so "#section"
// links land on them. Site links stay in the site: pages of this app use the router, pages
// served separately (/flash, /viewer, /app, files) load normally; only links off the site
// (source code on GitHub, datasheets) open a new tab.
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { headingSlug, textOf } from "../lib/slug";

/** Paths served outside this React app (static tools, the OS, files). */
const outsideApp = (path: string) => /^\/(flash|viewer|app|api)(\/|$)/.test(path) || /\.[a-z0-9]+$/i.test(path);

const heading = (Tag: "h1" | "h2" | "h3" | "h4") =>
  function Heading({ children }: { children?: ReactNode }) {
    return <Tag id={headingSlug(textOf(children))}>{children}</Tag>;
  };

const MD_COMPONENTS: Components = {
  h1: heading("h1"), h2: heading("h2"), h3: heading("h3"), h4: heading("h4"),
  a({ href = "", children }) {
    if (href.startsWith("/") && !href.startsWith("//") && !outsideApp(href.split(/[?#]/)[0])) {
      return <Link to={href}>{children}</Link>;
    }
    if (/^https?:/.test(href)) return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
    return <a href={href}>{children}</a>;
  },
};

export default function MarkdownArticle({ md, className = "" }: { md: string; className?: string }) {
  return (
    <article className={`prose ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{md}</ReactMarkdown>
    </article>
  );
}
