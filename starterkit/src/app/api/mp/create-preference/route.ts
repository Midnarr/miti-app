import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(request: Request) {
  try {
    const { expenseId } = await request.json();
    const supabase = await createClient();

    // 1. Obtener datos del Gasto y quién lo debe cobrar (payer_id es quien paga, el acreedor es el OTRO)
    // OJO: En tu tabla, 'payer_id' suele ser quien PAGÓ originalmente (el acreedor).
    // El 'debtor_email' es quien debe pagar ahora.
    
    const { data: expense } = await supabase
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

    if (!expense) throw new Error("Gasto no encontrado");

    // 2. Verificar si el acreedor (amigo) tiene Mercado Pago conectado
    const receiverToken = expense.profiles?.mp_access_token;
    
    if (!receiverToken) {
      return NextResponse.json(
        { error: "Tu amigo aún no ha conectado su cuenta de Mercado Pago." },
        { status: 400 }
      );
    }

    // 3. Configurar Mercado Pago con el Token del AMIGO (no el tuyo)
    const client = new MercadoPagoConfig({ accessToken: receiverToken });
    const preference = new Preference(client);

    // 4. Crear la preferencia de pago
    const result = await preference.create({
      body: {
        items: [
          {
            id: expense.id,
            title: expense.description,
            quantity: 1,
            unit_price: Number(expense.amount), // Lo que TÚ debes pagar
            currency_id: "ARS",
          },
        ],
        // A donde volver después de pagar
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mp/success-payment?expenseId=${expense.id}`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
        },
        auto_return: "approved",
      }
    });

    // 5. Devolver el link de pago
    return NextResponse.json({ url: result.init_point });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}