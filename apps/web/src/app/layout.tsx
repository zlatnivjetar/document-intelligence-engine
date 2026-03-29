import type { ReactNode } from "react";

import { Source_Sans_3, Space_Grotesk } from "next/font/google";

import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans-3"
});

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  return (
    <html
      className={`${displayFont.variable} ${bodyFont.variable}`}
      lang="en"
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
