import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

const display = Archivo({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Flujo — Finanzas personales",
  description: "Controla tus ingresos, gastos, presupuestos y metas de ahorro.",
  appleWebApp: {
    capable: true,
    title: "Flujo",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
