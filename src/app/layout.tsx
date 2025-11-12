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
        {/* Tailwind CDN + Config */}
        <Script id="tw-cdn" src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        <Script id="tw-config" strategy="beforeInteractive">
          {`
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    primary: {
                      50: '#eff6ff',
                      100: '#dbeafe',
                      200: '#bfdbfe',
                      300: '#93c5fd',
                      400: '#60a5fa',
                      500: '#3b82f6',
                      600: '#2563eb',
                      700: '#1d4ed8',
                      800: '#1e40af',
                      900: '#1e3a8a',
                    }
                  }
                }
              }
            }
          `}
        </Script>
        {/* Chart.js */}
        <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="afterInteractive" />
        <style>{`
          /* Estilos globales del sistema */
          .gradient-primary { background: linear-gradient(135deg,#3b82f6,#1d4ed8); }
          .gradient-success { background: linear-gradient(135deg,#10b981,#059669); }
          .gradient-warning { background: linear-gradient(135deg,#f59e0b,#d97706); }
          .gradient-purple  { background: linear-gradient(135deg,#8b5cf6,#7c3aed); }
          .card-hover { transition: transform .15s ease, box-shadow .15s ease; }
          .card-hover:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,.07); }
          .table-row { transition: background .15s ease; }
          .table-row:hover { background: #fafafa; }
          .custom-scrollbar::-webkit-scrollbar{height:8px;width:8px}
          .custom-scrollbar::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:9999px}
          .notification-dot { line-height: 1; }
          .btn-primary { background:#2563eb; }
          .btn-primary:hover { background:#1d4ed8; }
          .empty-state { opacity: .85; }
        `}</style>
      </head>
      <body className={`${inter.variable} bg-gray-50 font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
