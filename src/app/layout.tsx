import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muul - Tu guia inteligente para explorar lo mejor de Mexico",
  description:
    "Descubre lo mejor de Mexico durante el Mundial FIFA 2026. Rutas inteligentes, negocios locales, gamificacion y soporte multilingue.",
  keywords: ["Mexico", "Mundial 2026", "turismo", "mapa", "guia"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className="bg-surface text-on-surface font-body antialiased">{children}</body>
    </html>
  );
}
