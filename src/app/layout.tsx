import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import AuthHeaderClient from "./AuthHeaderClient";
import { ErrorBoundary } from "../components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TCQ Scorecard",
  description: "Powered by The Curiosity Quotient",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} antialiased`}
      >
        {/* AuthHeader is now a client component */}
        <AuthHeaderClient />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
