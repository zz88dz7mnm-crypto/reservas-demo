import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peluquería — Reservas Online",
  description: "Sistema de reservas online",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
