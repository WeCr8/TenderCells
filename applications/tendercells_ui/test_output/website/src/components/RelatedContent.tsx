// RelatedContent - the "Keep going" block: for a page's topics, the guides, lessons, docs,
// OS pages and tools that go with it (data/contentGraph.ts), in reading order, without the
// page itself. Site pages use the router; the OS, the flasher and files load normally.
import { Link, useLocation } from "react-router-dom";
import { KIND_LABEL, KIND_ORDER, TOPICS, TOPICS_BY_PATH, type ContentLink, type TopicId } from "../data/contentGraph";
import "./RelatedContent.css";

const outsideApp = (to: string) => /^\/(app|flash|viewer|api)(\/|\?|$)/.test(to) || /\.[a-z0-9]+$/i.test(to.split(/[?#]/)[0]);

export function ContentLinkItem({ link }: { link: ContentLink }) {
  const body = (
    <>
      <span className={`rc-kind rc-kind-${link.kind}`}>{KIND_LABEL[link.kind]}</span>
      <span className="rc-title">{link.title}</span>
    </>
  );
  return outsideApp(link.to)
    ? <a className="rc-link" href={link.to}>{body}</a>
    : <Link className="rc-link" to={link.to}>{body}</Link>;
}

interface Props {
  /** Topics to show; defaults to the topics mapped to the current path. */
  topics?: TopicId[];
  title?: string;
}

export default function RelatedContent({ topics, title = "Keep going" }: Props) {
  const { pathname } = useLocation();
  const ids = topics ?? TOPICS_BY_PATH[pathname] ?? [];
  if (!ids.length) return null;
  return (
    <section className="rc" aria-label={title}>
      <h2 className="rc-heading">{title}</h2>
      <div className="rc-grid">
        {ids.map((id) => {
          const topic = TOPICS[id];
          const links = [...topic.links]
            .filter((l) => l.to.split("#")[0] !== pathname)
            .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
          return (
            <div key={id} className="rc-topic">
              <h3>{topic.title}</h3>
              <p>{topic.blurb}</p>
              <ul>{links.map((l) => <li key={l.to + l.title}><ContentLinkItem link={l} /></li>)}</ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
