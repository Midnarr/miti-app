import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(request: Request) {
  try {
    const { expenseId } = await request.json();

    if (!expenseId) {
      return NextResponse.json({ error: "Falta el ID del gasto" }, { status: 400 });
    }

    // 1. INICIAR SUPABASE CON PERMISOS DE ADMIN (Service Role)
    // Usamos esto para poder leer el 'mp_access_token' del otro usuario (que es privado)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. BUSCAR EL GASTO Y EL DUEÑO (ACREEDOR)
    // Usamos 'payer:profiles!payer_id' para decirle explícitamente cómo unir las tablas
    const { data: expense, error } = await supabaseAdmin
      .from("expenses")
      .select(`
        *,
        payer:profiles!payer_id (
          mp_access_token,
          username,
          email
        )
      `)
      .eq("id", expenseId)
      .single();

    if (error || !expense) {
      console.error("Error DB (Consulta Gasto):", error);
      throw new Error("No se pudo encontrar el gasto o la relación con el usuario.");
    }

    // 3. OBTENER EL TOKEN DEL ACREEDOR
    // @ts-ignore
    const receiverToken = expense.payer?.mp_access_token;
    
    if (!receiverToken) {
      return NextResponse.json(
        { error: "El usuario que debe cobrar no ha conectado su cuenta de Mercado Pago todavía." },
        { status: 400 }
      );
    }

    // 4. CONFIGURAR MERCADO PAGO CON ESE TOKEN
    const client = new MercadoPagoConfig({ accessToken: receiverToken });
    const preference = new Preference(client);

    // 5. CREAR LA PREFERENCIA DE PAGO
    const result = await preference.create({
      body: {
        items: [
          {
            id: expense.id,
            title: expense.description, // "Cena", "Uber", etc.
            quantity: 1,
            unit_price: Number(expense.amount), // El monto que tú debes pagar
            currency_id: "ARS",
          },
        ],
        // URLs de retorno
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mp/success-payment?expenseId=${expense.id}`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
        },
        auto_return: "approved",
      }
    });

    // 6. DEVOLVER EL LINK AL FRONTEND
    return NextResponse.json({ url: result.init_point });

  } catch (error: any) {
    console.error("Error General API MP:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}