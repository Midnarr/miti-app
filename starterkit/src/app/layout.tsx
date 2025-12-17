import type { Metadata, Viewport } from "next"; // 👈 Asegúrate de importar Viewport si usas themeColor separado
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 1. CONFIGURACIÓN DE VISTA (Colores de barra de estado en móviles)
export const viewport: Viewport = {
  themeColor: "#4F46E5", // El color índigo de tu marca
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Evita zoom accidental al tocar inputs en iOS
};

// 2. METADATOS E ÍCONOS
export const metadata: Metadata = {
  title: "Miti",
  description: "Divide gastos con amigos fácilmente.",
  manifest: "/manifest.json", // 👈 Conexión con Android
  icons: {
    icon: "/icon-512.png",     // Favicon para navegador
    apple: "/apple-touch-icon.png", // 👈 Ícono para iPhone/iPad
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}