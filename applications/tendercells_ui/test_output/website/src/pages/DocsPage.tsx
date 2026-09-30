// DocsPage — the project documentation on tendercells.com.
//   /docs         all guides and references, grouped (same cards as Learn / Education)
//   /docs/:slug   one doc (public/docs/<slug>.md, generated from the repo by scripts/sync-docs.mjs)
// Readers stay on the site; GitHub is only linked for the source file itself.
import { Link, useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import PageHero from "../components/PageHero";
import DocGroups from "../components/DocGroups";
import MarkdownArticle from "../components/MarkdownArticle";
import { useMarkdown } from "../hooks/useMarkdown";
import { siteDocBySlug } from "../data/docs";

function DocIndex() {
  return (
    <PageLayout>
      <PageHero
        gradient="linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)"
        title="Documentation"
        subtitle="Build guides, references and school setup for Tender Cells - the same docs the project keeps in its open-source repository."
      />
      <DocGroups />
      <h3 id="product-docs" style={{ margin: "1.5rem 0 .75rem" }}>Products &amp; project</h3>
      <div className="prose">
        <ul>
          {["products", "chicken-tender", "chicken-tender-cad", "roaming-roost", "barn-brain", "barn-brain-implementation-plan",
            "developer", "developer-hardware", "product-ideas", "roadmap", "contributing", "security"].map((s) => {
            const d = siteDocBySlug(s);
            return d ? <li key={s}><Link to={`/docs/${s}`}>{d.title}</Link></li> : null;
          })}
        </ul>
      </div>
    </PageLayout>
  );
}

function DocView({ slug }: { slug: string }) {
  const doc = siteDocBySlug(slug);
  const md = useMarkdown(`/docs/${slug}.md`);
  return (
    <PageLayout>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1rem" }}>
        <p style={{ fontSize: ".9rem", marginBottom: "1rem" }}>
          <Link to="/">Home</Link> › <Link to="/docs">Docs</Link>{doc ? ` › ${doc.title}` : ""}
        </p>
        {(md === false || !doc) && (
          <div className="prose">
            <h2>Page not found</h2>
            <p>That document isn't published here. See <Link to="/docs">all documentation</Link>.</p>
          </div>
        )}
        {doc && md === null && <p>Loading…</p>}
        {doc && md && <MarkdownArticle md={md} className="doc-body" />}
        {doc && (
          <p style={{ fontSize: ".85rem", marginTop: "2rem", opacity: 0.75 }}>
            Kept in step with <code>{doc.source}</code> in the open-source repository.
          </p>
        )}
      </div>
    </PageLayout>
  );
}

export default function DocsPage() {
  const { slug } = useParams();
  return slug ? <DocView slug={slug} /> : <DocIndex />;
}
