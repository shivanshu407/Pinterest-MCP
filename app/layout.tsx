import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pinterest Inspiration MCP",
    template: "%s | Pinterest Inspiration MCP",
  },
  description:
    "Connect Pinterest boards to ChatGPT so saved visual inspiration can be analyzed directly inside conversations.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
