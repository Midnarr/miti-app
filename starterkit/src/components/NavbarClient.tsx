"use client";

import Link from "next/link";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

export default function NavbarClient({ user }: { user: any }) {
  const router = useRouter();
  const supabase = createClient();
  const userInitial = user.email?.charAt(0).toUpperCase() || "U";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login"); 
    router.refresh();
  };

  return (
    // BARRA SUPERIOR FIJA (Sticky) ESTILO APP
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 h-14 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
        
        {/* 1. IZQUIERDA: Logo Estilo "Instagram" */}
        <div className="flex-shrink-0">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight text-gray-900 font-serif italic hover:text-indigo-600 transition-colors">
            Miti
          </Link>
        </div>

        {/* 2. DERECHA: Iconos de Acción Directa */}
        <div className="flex items-center gap-5">
          
          {/* A. Icono Grupos (Equivalente al botón + de crear) */}
          <Link href="/dashboard/groups" title="Mis Grupos">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 text-gray-700 hover:text-indigo-600 transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 5.472m0 0a9.09 9.09 0 0 0-3.279 3.298m.944-5.497-1.51.58a1.5 1.5 0 0 0-1.282 1.346l-.01.125a12.053 12.053 0 0 0 1.258 7.324c.335.533.918.76 1.485.556l1.248-.46a1.5 1.5 0 0 0 1.09-1.258l.115-.992a5.966 5.966 0 0 1 1.63-3.456m-.001 0a9.03 9.03 0 0 1-.95-2.268" />
            </svg>
          </Link>

          {/* B. Icono Configuración/Perfil */}
          <Link href="/settings" title="Configuración">
             <div className="h-7 w-7 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors">
               {userInitial}
             </div>
          </Link>

          {/* C. Icono Salir */}
          <button 
            onClick={handleLogout} 
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Cerrar Sesión"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
          </button>
          
        </div>
      </div>
    </nav>
  );
}