import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
// Usamos try/catch en el import por si el archivo no existe o tiene errores
import AdvancedCreateGroupForm from "@/components/AdvancedCreateGroupForm";

export default async function GroupsPage() {
  const supabase = await createClient();
  
  // Verificación de usuario protegida
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  let myGroups = [];
  let dbError = null;

  try {
    // Intentamos obtener los grupos
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    myGroups = data || [];
  } catch (err: any) {
    // Si falla, capturamos el error para mostrarlo en pantalla
    console.error("Error cargando grupos:", err);
    dbError = err.message || JSON.stringify(err);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Si hay error de Base de Datos, lo mostramos aquí en ROJO */}
        {dbError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow">
            <p className="font-bold">⚠️ Error detectado:</p>
            <p className="font-mono text-sm">{dbError}</p>
          </div>
        )}

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
          
          {/* Formulario */}
          <div className="md:col-span-1">
             <AdvancedCreateGroupForm />
          </div>

          {/* Lista de Grupos */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="font-bold text-gray-700 text-lg">Tus grupos activos</h2>
            
            {myGroups.length === 0 && !dbError ? (
              <div className="bg-white p-10 rounded-xl border border-dashed border-gray-300 text-center">
                <p className="text-gray-500 mb-2">No perteneces a ningún grupo aún.</p>
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