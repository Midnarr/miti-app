import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // El email de supabase envía un código en la URL (ej: ?code=xyz...)
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    // Intercambiamos el código por una sesión válida
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirigimos al usuario a su dashboard
  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}