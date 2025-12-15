import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // El email de supabase envía un código en la URL (ej: ?code=xyz...)
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // Si vienes de registrarte, te manda al dashboard. Si no, al home.
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    // Intercambiamos el código temporal por una sesión real de usuario
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirigimos al usuario a donde debe ir (Dashboard)
  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}