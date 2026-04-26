import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Newsreader } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const twCenMT = localFont({
  src: "../public/fonts/TwCenMT.ttf",
  variable: "--font-tw-cen",
  display: "swap",
});

import { ThemeInjector } from "@/components/settings/ThemeInjector";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
// ... existing metadata code ...
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${newsreader.variable} ${twCenMT.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <ThemeInjector />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
