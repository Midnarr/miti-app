"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; // Para saber en qué página estamos
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

export default function NavbarClient({ user }: { user: any }) {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();
  
  const userInitial = user.email?.charAt(0).toUpperCase() || "U";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login"); 
    router.refresh();
  };

  // Función para saber si el link está activo (para pintarlo de azul)
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 h-16 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-full relative flex items-center justify-between">
        
        {/* 1. IZQUIERDA: Logo Moderno y Limpio (Sans-Serif) */}
        <div className="flex-shrink-0 w-10">
          <Link href="/dashboard" className="text-2xl font-black tracking-tighter text-indigo-600 hover:opacity-80 transition-opacity">
            Miti.
          </Link>
        </div>

        {/* 2. CENTRO: Menú de Navegación (Dashboard, Grupos, Amigos, Config) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-1 md:gap-6 bg-gray-50/80 backdrop-blur-md px-2 py-1.5 rounded-full border border-gray-100 shadow-sm">
            
            {/* ITEM: Dashboard */}
            <Link 
              href="/dashboard"
              className={`p-2 rounded-full transition-all ${isActive('/dashboard') ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.632 8.632a.75.75 0 0 1-.53 1.28h-1.463v6.752a2 2 0 0 1-2 2H13.5v-5.25a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75v5.25H6.82a2 2 0 0 1-2-2V13.753H3.358a.75.75 0 0 1-.53-1.28L11.47 3.841Z" />
              </svg>
            </Link>

            {/* ITEM: Grupos */}
            <Link 
              href="/dashboard/groups"
              className={`p-2 rounded-full transition-all ${isActive('/groups') || pathname.includes('/groups/') ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grupos"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.08.051c-.569.312-1.182.56-1.817.741a6.375 6.375 0 0 0-10.536 0 7.487 7.487 0 0 1-1.817-.741l-.08-.051v-.003ZM17.25 19.125a7.125 7.125 0 0 1 7.125 0v.003l-.08.051c-.569.312-1.182.56-1.817.741a6.375 6.375 0 0 0-10.536 0 7.487 7.487 0 0 1-1.817-.741l-.08-.051v-.003Z" />
              </svg>
            </Link>

            {/* ITEM: Amigos */}
            <Link 
              href="/friends"
              className={`p-2 rounded-full transition-all ${isActive('/friends') ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="Amigos"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.7-.003Z" />
              </svg>
            </Link>

            {/* ITEM: Configuración (Ahora aquí en el centro) */}
            <Link 
              href="/settings"
              className={`p-2 rounded-full transition-all ${isActive('/settings') ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              title="Configuración"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
              </svg>
            </Link>

          </div>
        </div>

        {/* 3. DERECHA: Avatar del Usuario (Distinto y Separado) */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <button 
            onClick={handleLogout}
            className="h-9 w-9 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-bold hover:bg-gray-700 transition-colors shadow-sm ring-2 ring-white"
            title={`Usuario: ${user.email} (Clic para salir)`}
          >
            {userInitial}
          </button>
        </div>

      </div>
    </nav>
  );
}