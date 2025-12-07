// MainLayout.tsx
import React from "react";
import TopNavBar from "./TopNavBar";
import Container from "@mui/material/Container";

type MainLayoutProps = {
  title?: string;
  children: React.ReactNode;
};

export default function MainLayout({ title, children }: MainLayoutProps) {
  return (
    <div className="app-root">
      <TopNavBar title={title} />
      <Container maxWidth="xl" sx={{ py: 2 }}>
        {children}
      </Container>
    </div>
  );
}
