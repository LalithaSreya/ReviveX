import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReviveX - B2B Circular Economy & Waste-to-Value Platform",
  description: "Enterprise-grade scrap recovery, e-waste recycling, refurbishment, and sustainability reporting.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} h-full scroll-smooth`}>
      <body className="bg-slate-50 text-slate-900 min-h-full flex flex-col antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
