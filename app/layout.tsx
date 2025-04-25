import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "AgileSpace",
  description: "AI-powered platform for Agile teams",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
