import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import DiscountWheel from "@/components/DiscountWheel";
import CookieConsent from "@/components/CookieConsent";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShirtHappenZ",
  description: "Custom T-Shirt Printing and Design Services",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShirtHappenZ"
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF1744"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <DiscountWheel />
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
