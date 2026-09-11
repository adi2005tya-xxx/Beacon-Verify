import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beacon Verify — Planner Verification & Onboarding",
  description: "Internal Beacon team tool for planner onboarding: details letterhead, certificate, and document merge.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
