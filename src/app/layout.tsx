import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conversa — AI Customer Support & Messaging Automation SaaS",
  description:
    "Self-service AI messaging automation for Bangladeshi businesses on Facebook Messenger, Instagram, and WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-slate-50 text-slate-900 antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
