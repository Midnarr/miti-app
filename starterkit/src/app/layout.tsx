import type { Metadata, Viewport } from "next"; // 👈 Importamos Viewport
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

// 1. CONFIGURACIÓN DE VISTA (Colores y Zoom en móviles)
export const viewport: Viewport = {
  themeColor: "#4F46E5", // Color índigo (ajústalo a tu marca)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Evita que iOS haga zoom al tocar inputs
};

// 2. METADATOS E ÍCONOS
export const metadata: Metadata = {
  title: "Miti - Gastos Compartidos",
  description: "Divide cuentas claras con amigos",
  
  // 👇 LO NUEVO PARA LA APP MÓVIL
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-512.png",           // Favicon estándar
    apple: "/apple-touch-icon.png",  // Ícono para iPhone (si no creaste este archivo, pon el mismo icon-512.png)
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Miti",
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