import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const jetBrainsSans = localFont({
  src: "./fonts/JetBrainsSans.ttf",
  variable: "--font-jetbrains-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Obyron - Sites, Automacoes e IA",
  description: "Obyron une sites, automacoes e inteligencia artificial em um unico ecossistema.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${jetBrainsSans.variable} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
