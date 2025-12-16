import { createClient } from "@supabase/supabase-js"; // 👈 Usamos la librería directa, no la del server
import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(request: Request) {
  try {
    const { expenseId } = await request.json();

    if (!expenseId) throw new Error("Falta el ID del gasto");

    // 1. Usamos la LLAVE MAESTRA (Service Role) para poder leer el token del amigo
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // 👈 Esta es la clave que acabas de agregar
    );

    // 2. Buscamos el gasto y los datos PRIVADOS del acreedor
    const { data: expense, error } = await supabaseAdmin
      .from("expenses")
      .select(`
        *,
        profiles:payer_id (
          mp_access_token,
          username
        )
      `)
      .eq("id", expenseId)
      .single();

    if (error || !expense) {
      console.error("Error DB:", error);
      throw new Error("Gasto no encontrado en la base de datos");
    }

    // 3. Verificamos si tiene token
    // @ts-ignore (A veces TS se queja de las relaciones anidadas)
    const receiverToken = expense.profiles?.mp_access_token;
    
    if (!receiverToken) {
      return NextResponse.json(
        { error: "Tu amigo aún no ha conectado Mercado Pago." },
        { status: 400 }
      );
    }

    // 4. Configurar Mercado Pago con el Token del AMIGO
    const client = new MercadoPagoConfig({ accessToken: receiverToken });
    const preference = new Preference(client);

    // 5. Crear la preferencia
    const result = await preference.create({
      body: {
        items: [
          {
            id: expense.id,
            title: expense.description,
            quantity: 1,
            unit_price: Number(expense.amount),
            currency_id: "ARS",
          },
        ],
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mp/success-payment?expenseId=${expense.id}`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
        },
        auto_return: "approved",
      }
    });

    return NextResponse.json({ url: result.init_point });

  } catch (error: any) {
    console.error("Error en API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}