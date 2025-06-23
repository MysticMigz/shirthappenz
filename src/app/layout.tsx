import type { Metadata } from "next";
import { Inter, Fredoka } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"]
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["300", "400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "ShirtHappenZ - Custom T-Shirt Printing & Design Online",
  description: "Design and order custom t-shirts, hoodies, and apparel online. Fast turnaround, no minimum order. DTG, screen printing, and embroidery services.",
  keywords: "custom t-shirts, t-shirt printing, online design, custom apparel, DTG printing, screen printing, embroidery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${fredoka.variable} font-sans antialiased bg-white`}
      >
        {children}
      </body>
    </html>
  );
}
