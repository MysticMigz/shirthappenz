import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: "ShirtHappenz - Custom Jersey & Shirt Printing",
  description: "Create your perfect custom jersey or shirt with ShirtHappenz. Professional name and number printing services with unique designs.",
  keywords: "custom jersey, shirt printing, custom designs, jersey printing, name printing, number printing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
