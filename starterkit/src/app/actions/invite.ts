"use server";

import { createClient } from "@supabase/supabase-js";

// ⚠️ IMPORTANTE: Usamos la librería base de JS, no la de Next.js helper
// porque necesitamos usar la SERVICE_ROLE_KEY para tener permisos de admin.
export async function inviteUserToApp(email: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Asegúrate de tener esto en tu .env.local
  );

  // 1. Verificamos si el usuario ya existe en Auth
  // (Listamos usuarios filtrando por email - requiere permisos admin)
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    // Si ya existe, no enviamos invitación de registro, solo retornamos.
    // (Tu lógica actual ya lo agregará al grupo si existe en profiles)
    return { success: true, message: "Usuario ya registrado" };
  }

  // 2. Si NO existe, le mandamos el email de invitación
  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    // Opcional: Puedes pasar metadata inicial si quieres
    data: { 
        username: email.split("@")[0] // Username temporal
    },
    // Opcional: A dónde redirige al hacer clic en el email
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` 
  });

  if (error) {
    console.error("Error invitando:", error);
    return { success: false, message: error.message };
  }

  return { success: true, message: "Invitación enviada" };
}