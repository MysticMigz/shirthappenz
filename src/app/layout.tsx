import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import DiscountWheel from "@/components/DiscountWheel";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShirtHappenZ",
  description: "Custom T-Shirt Printing and Design Services",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#FF1744",
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
        </Providers>
      </body>
    </html>
  );
}
