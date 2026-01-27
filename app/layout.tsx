import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veervrat",
  description: "A system for inner transformation and character development",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/* 
        Use Tailwind's antialiased and any other global classes if needed.
        No need to reference font variables/classes — your fonts are set in CSS!
      */}
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}