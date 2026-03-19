import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secure SFTP File Manager",
  description: "Advanced, secure, and performant browser-based SFTP client",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
