import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

// Define la URL base de tu sitio (usa tu dominio de Vercel)
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://miti.vercel.app"; 

// 1. CONFIGURACIÓN DE VISTA (Colores y Zoom en móviles)
export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Evita zoom accidental en iOS
};

// 2. METADATOS E ÍCONOS (SEO + APP MÓVIL)
export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  
  // Título inteligente: Si estás en /login dirá "Login | Miti App", si no, el default.
  title: {
    default: "Miti - Divide Gastos y Cuentas Claras con Amigos",
    template: "%s | Miti App"
  },
  description: "La forma más fácil de dividir gastos de viajes, cenas y salidas. Sube tickets, crea grupos y salda deudas sin complicaciones.",
  
  keywords: ["gastos compartidos", "dividir cuentas", "finanzas parejas", "viajes amigos", "app de gastos"],
  authors: [{ name: "Miti Team" }],

  // Configuración para Móviles (PWA)
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-512.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Miti",
  },

  // Cómo se ve al compartir en WhatsApp/Twitter/LinkedIn
  openGraph: {
    title: "Miti - Cuentas claras, amistades largas",
    description: "Olvídate de perseguir a tus amigos para que paguen. Gestiona gastos compartidos gratis.",
    url: baseUrl,
    siteName: "Miti",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Miti App Preview",
      },
    ],
    locale: "es_AR",
    type: "website",
  },

  // 👇 AQUÍ PONES EL CÓDIGO QUE TE DE GOOGLE SEARCH CONSOLE
  verification: {
    google: "AwgXOLTc75DZS_TGMna8WFHTCsQf0ZPLQ-uvsTjYaoA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Navbar Global: Aparecerá en todas las páginas si estás logueado */}
        <Navbar /> 
        
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}