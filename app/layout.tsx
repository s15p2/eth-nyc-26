import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Uncross",
  description: "Uncross",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-[#232323] text-[#dcd5dd]">
        <header className="flex justify-between items-center p-6">
          <div style={{ left: "2em", position: "relative" }}>
            <span
              style={{
                fontFamily: "Times New Roman, Times, serif",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: "2.5rem",
                letterSpacing: "0.05em",
              }}
            >
              uncross
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
