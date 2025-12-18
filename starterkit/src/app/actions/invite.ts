"use server";

import { createClient } from "@supabase/supabase-js";

export async function inviteUserToApp(email: string) {
  console.log("🚀 Iniciando invitación para:", email);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ ERROR: Faltan variables de entorno (URL o SERVICE_ROLE_KEY)");
    return { success: false, message: "Error de configuración en el servidor" };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 1. Verificamos si existe
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error("❌ Error listando usuarios:", listError.message);
    return { success: false, message: "Error verificando usuario" };
  }

  const existingUser = listData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    console.log("⚠️ El usuario ya existe:", existingUser.id);
    return { success: true, message: "Usuario ya registrado" };
  }

  // 2. Enviamos invitación
  console.log("📧 Enviando email a Supabase...");
  
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback` 
  });

  if (error) {
    console.error("❌ Error Supabase Invite:", error.message);
    return { success: false, message: error.message };
  }

  console.log("✅ Invitación enviada con éxito:", data);
  return { success: true, message: "Invitación enviada" };
}