import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import FriendSystem from "@/components/FriendSystem";
import UsernameSetup from "@/components/UsernameSetup";
import Link from "next/link";

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verificar si el usuario ya tiene username configurado
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const hasUsername = profile && profile.username;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-extrabold text-gray-900">Social 👥</h1>
           <p className="text-gray-500 mt-1">Busca amigos y gestiona solicitudes.</p>
        </div>
        <Link href="/dashboard" className="text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            ← Volver al Dashboard
        </Link>
      </div>

      {!hasUsername ? (
        // Si no tiene username, obligamos a crearlo
        <div className="max-w-md mx-auto mt-10">
           <UsernameSetup 
             // Como es Server Component, no podemos pasar funciones callback fácil, 
             // pero al refrescar la página en el componente cliente, se detectará el cambio.
             onUsernameSet={() => {}} 
           />
        </div>
      ) : (
        // Si ya tiene, mostramos el sistema completo
        <FriendSystem currentUserId={user.id} />
      )}
      
    </div>
  );
}