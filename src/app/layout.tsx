import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XpiPet - Identidad Digital para Mascotas",
  description: "Memoria de vida y identificación QR/NFC para tu mascota",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
