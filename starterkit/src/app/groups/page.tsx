import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdvancedCreateGroupForm from "@/components/AdvancedCreateGroupForm";

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. OBTENER MIS GRUPOS
  const { data: myGroups } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });

  // 2. OBTENER AMIGOS (Para pasarlos al formulario de crear grupo)
  const { data: friends } = await supabase
    .from("friends")
    .select("*")
    .order("friend_name", { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Mis Grupos 👥</h1>
            <p className="text-gray-500 text-sm mt-1">Gestiona tus gastos compartidos</p>
          </div>
          <Link href="/dashboard" className="text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            ← Volver al Dashboard
          </Link>
        </div>

        {/* LAYOUT: Grid de 2 columnas en PC, 1 en Móvil */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* COLUMNA 1: Formulario de Crear (Con selector de amigos) */}
          <div className="md:col-span-1">
            <AdvancedCreateGroupForm friends={friends || []} />
          </div>

          {/* COLUMNA 2: Lista de Grupos */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="font-bold text-gray-700 text-lg">Tus grupos activos</h2>
            
            {!myGroups || myGroups.length === 0 ? (
              <div className="bg-white p-10 rounded-xl border border-dashed border-gray-300 text-center">
                <p className="text-gray-500 mb-2">No perteneces a ningún grupo aún.</p>
                <p className="text-sm text-indigo-500">¡Usa el formulario para crear el primero!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {myGroups.map((group) => (
                  <Link key={group.id} href={`/groups/${group.id}`}>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">
                          🏕️
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block group-hover:text-indigo-700 transition-colors">
                            {group.name}
                          </span>
                          <span className="text-xs text-gray-400">Clic para ver gastos</span>
                        </div>
                      </div>
                      <span className="text-gray-300 group-hover:text-indigo-500 transition-colors">
                        ➜
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}