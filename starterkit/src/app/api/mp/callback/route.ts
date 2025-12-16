import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  // 1. Si el usuario canceló o hubo error en MP
  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/settings?error=mp_cancelled`);
  }

  try {
    // 2. Canjeamos el CÓDIGO por el TOKEN (Llamada a Mercado Pago)
    const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_secret: process.env.MP_CLIENT_SECRET,
        client_id: process.env.MP_CLIENT_ID,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mp/callback`, 
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Error MP:", tokenData);
      throw new Error("Error obteniendo token de MP");
    }

    // 3. Guardamos las llaves en Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Usuario no autenticado");

    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        mp_access_token: tokenData.access_token,
        mp_refresh_token: tokenData.refresh_token,
        mp_user_id: tokenData.user_id?.toString(), // El ID del usuario en MP
        mp_expires_in: tokenData.expires_in,
      })
      .eq("id", user.id);

    if (dbError) {
      console.error("Error DB:", dbError);
      throw new Error("Error guardando en base de datos");
    }

    // 4. Todo salió bien: Devolvemos al usuario a Configuración con mensaje de éxito
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/settings?success=mp_connected`);

  } catch (error) {
    console.error(error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/settings?error=internal_error`);
  }
}