import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "Biblio Kubernetes - Système de gestion de bibliothèque",
  description: "Plateforme de gestion de bibliothèque avec microservices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
