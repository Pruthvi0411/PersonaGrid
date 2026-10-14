import type { Metadata } from "next";
import "./globals.css";
import { ClientErrorGuard } from "@/components/providers/client-error-guard";

export const metadata: Metadata = {
  title: "PersonaGrid | Synthetic Identity Leasing Marketplace",
  description:
    "Monetize your lifestyle preferences with zero PII exposure, or query the grid for instant, risk-free market research.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-black text-[#E1E0CC] antialiased">
        <ClientErrorGuard />
        {children}
      </body>
    </html>
  );
}
