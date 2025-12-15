import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Obtener mis grupos
  const { data: myGroups } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });

  // 2. Server Action para crear grupo
  async function createGroup(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    if (!name) return;

    const supabase = await createClient();
    await supabase.from("groups").insert({ name });
    revalidatePath("/groups");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mis Grupos 👥</h1>
          <Link href="/dashboard" className="text-indigo-600 hover:underline">
            ← Volver al Dashboard
          </Link>
        </div>

        {/* Formulario Crear Grupo */}
        <div className="bg-white p-6 rounded-xl shadow border mb-8">
          <h2 className="font-bold text-lg mb-4">Nuevo Grupo</h2>
          <form action={createGroup} className="flex gap-4">
            <input
              name="name"
              type="text"
              placeholder="Ej: Viaje al Sur, Asado del Finde..."
              className="flex-1 border rounded p-2"
              required
            />
            <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
              Crear
            </button>
          </form>
        </div>

        {/* Lista de Grupos */}
        <div className="grid gap-4">
          {myGroups?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tienes grupos aún.</p>
          ) : (
            myGroups?.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <div className="bg-white p-6 rounded-xl shadow border hover:shadow-md transition cursor-pointer flex justify-between items-center">
                  <span className="font-bold text-lg">{group.name}</span>
                  <span className="text-gray-400 text-sm">Ver detalles →</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}