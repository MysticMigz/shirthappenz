import type { Metadata } from "next";
import { Inter, Fredoka } from "next/font/google";
import { UserProvider } from "@/context/UserContext";
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
  description: "Design and order custom t-shirts, hoodies, and apparel online. Fast turnaround, no minimum order. Featuring DTF and sublimation printing services.",
  keywords: "custom t-shirts, t-shirt printing, online design, custom apparel, DTF printing, sublimation printing, digital printing",
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
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
