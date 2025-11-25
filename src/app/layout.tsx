import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Sistema de Reclutamiento",
  description: "Plataforma integral de gestión de reclutamiento y recursos humanos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
        />
        {/* Chart.js */}
        <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="afterInteractive" />
      </head>
      <body className={`${inter.variable} bg-gray-50 font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}