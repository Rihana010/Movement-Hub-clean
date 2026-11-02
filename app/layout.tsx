import type { Metadata } from "next";
import "@fontsource-variable/big-shoulders-display";
import "@fontsource-variable/familjen-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Movement Hub",
  description: "Sign up to volunteer with an invite link, or sign in to run events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
