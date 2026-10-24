import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AprovaQim",
  description: "Aprovação de conteúdos entre a agência e seus clientes.",
};

// Draw under the iPhone notch/home bar (bars use safe-area padding) and tint the browser UI.
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#faf8fd",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-sm">{children}</body>
    </html>
  );
}
