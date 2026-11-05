import { useEffect } from "react";
import Header from "../components/Header";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  // Firebase Hosting rewrites unknown paths to index.html with a 200, so mark the 404 view
  // noindex; otherwise Google sees a soft 404 that claims the home page canonical.
  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex";
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);

  return (
    <>
      <Header />
      <main className="not-found-main">
        <h1>404 - Page Not Found</h1>
        <p>Sorry, the page you're looking for doesn't exist.</p>
      </main>
    </>
  );
}
