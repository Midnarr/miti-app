import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // <--- IMPORTAR

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Miti - Gastos Compartidos",
  description: "Divide cuentas claras con amigos",
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