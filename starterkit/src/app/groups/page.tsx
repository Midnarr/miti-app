import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdvancedCreateGroupForm from "@/components/AdvancedCreateGroupForm"; // 👈 Importamos el componente arreglado

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Obtener mis grupos
  const { data: myGroups } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* COLUMNA 1: Aquí cargamos el FORMULARIO SEPARADO (El que ya arreglaste) */}
          <div className="md:col-span-1">
            <AdvancedCreateGroupForm /> 
          </div>

          {/* COLUMNA 2: Lista de Grupos */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="font-bold text-gray-700 text-lg">Tus grupos activos</h2>
            
            {myGroups?.length === 0 ? (
              <div className="bg-white p-10 rounded-xl border border-dashed border-gray-300 text-center">
                <p className="text-gray-500 mb-2">No perteneces a ningún grupo aún.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {myGroups?.map((group) => (
                  <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">
                          🏕️
                        </div>
                        <span className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                          {group.name}
                        </span>
                      </div>
                      <span className="text-gray-300 group-hover:text-indigo-500">➜</span>
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