// DocGroups - the current documentation and build guides as card groups (Docs, Learn,
// Education). Every card is a page on this site.
import { Link } from "react-router-dom";
import { DOC_GROUPS, docHref, type DocLink } from "../data/docs";

const cardStyle = { textDecoration: "none", color: "inherit" } as const;

function DocCard({ d }: { d: DocLink }) {
  const href = docHref(d);
  const inSite = href.startsWith("/") && !/\.(xml|json|txt)$/.test(href) && !href.startsWith("/flash");
  const body = (
    <>
      <h3>{d.title}</h3>
      <p>{d.desc}</p>
      <span className="tag">{href.startsWith("/docs/") ? "Guide" : href.startsWith("/lessons/") ? "Lesson" : "Open"}</span>
    </>
  );
  if (inSite) return <Link className="card" to={href} style={cardStyle}>{body}</Link>;
  const external = /^https?:/.test(href);
  return (
    <a className="card" href={href} style={cardStyle} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {body}
    </a>
  );
}

/** Groups to show (by id); all when omitted. */
export default function DocGroups({ only }: { only?: string[] }) {
  return (
    <>
      {DOC_GROUPS.filter((g) => !only || only.includes(g.id)).map((g) => (
        <section key={g.id} aria-label={g.title}>
          <h3 id={g.id} style={{ margin: "1.5rem 0 .75rem" }}>{g.title}</h3>
          <div className="card-grid">
            {g.docs.map((d) => <DocCard key={d.title} d={d} />)}
          </div>
        </section>
      ))}
    </>
  );
}
