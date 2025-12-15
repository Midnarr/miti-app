import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import FriendsManager from "@/components/FriendsManager";
import Link from "next/link";

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Obtener la lista de amigos
  const { data: friends } = await supabase
    .from("friends")
    .select("*")
    .order("friend_name", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-extrabold text-gray-900">Agenda de Amigos 📒</h1>
           <p className="text-gray-500 mt-1">Guarda tus contactos para usarlos rápido.</p>
        </div>
        <Link href="/dashboard" className="text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            ← Volver al Dashboard
        </Link>
      </div>

      {/* Reutilizamos el componente Manager, pero ahora ocupa toda la pantalla de forma cómoda */}
      <FriendsManager friends={friends || []} />
      
    </div>
  );
}