import Header from "./Header";
import "./PageLayout.css";

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <>
      <Header />
      <main className="page-main">
        {children}
      </main>
    </>
  );
}
