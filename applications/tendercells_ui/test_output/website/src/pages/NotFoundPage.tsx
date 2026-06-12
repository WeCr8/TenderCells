import Header from "../components/Header";
import "./NotFoundPage.css";

export default function NotFoundPage() {
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
