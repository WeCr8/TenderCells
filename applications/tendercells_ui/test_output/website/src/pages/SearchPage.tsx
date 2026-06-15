// Site search results. Reads ?q= from the URL and renders client-side matches
// from the static search index. No backend required.
import { Link, useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { searchSite } from "../data/searchIndex";
import "./SearchPage.css";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const results = searchSite(query);

  return (
    <PageLayout>
      <section className="search-results">
        <h1>Search</h1>
        {query.trim() ? (
          <p className="search-summary">
            {results.length} result{results.length === 1 ? "" : "s"} for{" "}
            <strong>"{query}"</strong>
          </p>
        ) : (
          <p className="search-summary">Type a search term in the header to find pages and products.</p>
        )}

        {query.trim() && results.length === 0 && (
          <div className="search-empty">
            <p>No matches. Try a product name (e.g. "chicken"), a topic (e.g. "predator"), or a section (e.g. "education").</p>
            <p>
              Or jump to <Link to="/shop">Shop</Link>, <Link to="/education">Education</Link>,{" "}
              <Link to="/guides">Guides</Link>, or <Link to="/open-source">Open Source</Link>.
            </p>
          </div>
        )}

        <ul className="search-list">
          {results.map((r) => (
            <li key={r.path} className="search-item">
              <Link to={r.path} className="search-item-title">
                {r.title}
              </Link>
              <span className="search-item-path">{r.path}</span>
              <p className="search-item-desc">{r.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </PageLayout>
  );
}
