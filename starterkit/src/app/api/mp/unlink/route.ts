import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Borramos los datos de Mercado Pago del perfil
  const { error } = await supabase
    .from("profiles")
    .update({
      mp_access_token: null,
      mp_refresh_token: null,
      mp_user_id: null,
      mp_expires_in: null
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}