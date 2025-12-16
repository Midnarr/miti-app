import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) return NextResponse.redirect(new URL("/settings?error=no_code", request.url));

  try {
    // 1. Canjear el CODE por el ACCESS_TOKEN
    const response = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_secret: process.env.MP_CLIENT_SECRET, // Tu credencial de desarrollador
        client_id: process.env.MP_CLIENT_ID,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mp/callback`,
      }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Error en MP OAuth");

    // 2. Guardar el Token en el perfil del usuario
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("profiles").update({
        mp_access_token: data.access_token,
        mp_refresh_token: data.refresh_token,
        mp_user_id: data.user_id,
        mp_expires_in: data.expires_in
      }).eq("id", user.id);
    }

    return NextResponse.redirect(new URL("/settings?success=mp_connected", request.url));

  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/settings?error=auth_failed", request.url));
  }
}