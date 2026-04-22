import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Nottermost (local)",
  description: "Local dev UI for Nottermost",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

