import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import AvatarUpload from "@/components/AvatarUpload";
import UsernameEditor from "@/components/UsernameEditor";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Obtener perfil completo (Agregamos username_last_changed a la query)
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, username_last_changed")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-md mx-auto p-6 space-y-8">
      
      {/* Botón Volver */}
      <div className="flex items-center gap-2">
         <Link href="/dashboard" className="text-gray-400 hover:text-indigo-600 transition-colors">← Volver</Link>
         <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-6">
        
        {/* FOTO */}
        <AvatarUpload 
            uid={user.id} 
            url={profile?.avatar_url || null} 
            size={180}
        />

        <div className="w-full space-y-4 pt-4 border-t border-gray-100">
          
          {/* SECCIÓN USERNAME (Ahora usa el componente editor) */}
          <div className="flex flex-col items-center">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nombre de Usuario</label>
            
            {/* 👇 AQUÍ ESTÁ EL CAMBIO */}
            <UsernameEditor 
                currentUsername={profile?.username || ""} 
                lastChanged={profile?.username_last_changed}
            />
          </div>
          
          {/* SECCIÓN EMAIL */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
            <p className="text-lg font-semibold text-gray-800">{user.email}</p>
          </div>
        </div>

      </div>
    </div>
  );
}