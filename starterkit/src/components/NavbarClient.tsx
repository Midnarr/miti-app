"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { useState } from "react";

export default function NavbarClient({ user }: { user: any }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // FORZAMOS RECARGA COMPLETA: Esto limpia caché y quita el email sí o sí
    window.location.href = "/login";
  };

  const isActive = (path: string) => pathname === path;

  // Si no hay usuario, no mostramos nada (o podrías mostrar un Login button)
  if (!user) return null;

  const links = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Grupos", href: "/dashboard/groups" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* LOGO y LINKS ESCRITORIO */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl text-indigo-600">Miti</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(link.href)
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* PERFIL Y LOGOUT (Desktop) */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:gap-4">
            <span className="text-sm text-gray-600 font-medium">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800 font-medium border border-red-100 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
            >
              Salir
            </button>
          </div>

          {/* BOTÓN MENÚ MÓVIL */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Abrir menú</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* MENÚ MÓVIL */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100">
          <div className="pt-2 pb-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive(link.href)
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-4 border-t border-gray-200">
            <div className="flex items-center px-4 mb-3">
              <div className="text-sm font-medium text-gray-800">{user.email}</div>
            </div>
            <div className="space-y-1 px-4">
              <button
                onClick={handleLogout}
                className="block w-full text-center px-4 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}