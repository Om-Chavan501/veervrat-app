import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veervrat",
  description: "A system for inner transformation and character development",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
