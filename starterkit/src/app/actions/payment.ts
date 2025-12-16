"use server";

import { createClient } from "@/libs/supabase/server";
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function createPaymentLink(expenseId: string, amount: number, creditorId: string) {
  const supabase = await createClient();

  // 1. Obtener el Token del ACREEDOR (Quien recibe la plata)
  const { data: creditor } = await supabase
    .from("profiles")
    .select("mp_access_token")
    .eq("id", creditorId)
    .single();

  if (!creditor?.mp_access_token) {
    return { error: "El usuario no ha conectado su Mercado Pago." };
  }

  // 2. Inicializar MP con el token DEL ACREEDOR (No el tuyo)
  // Esto hace que la plata vaya directo a su cuenta.
  const client = new MercadoPagoConfig({ accessToken: creditor.mp_access_token });
  const preference = new Preference(client);

  try {
    const result = await preference.create({
      body: {
        items: [
          {
            id: expenseId,
            title: 'Pago en Miti',
            quantity: 1,
            unit_price: Number(amount),
            currency_id: 'ARS',
          },
        ],
        // Opcional: Configurar para que vuelva a la app al terminar
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?status=approved`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?status=failure`,
        },
        auto_return: 'approved',
      }
    });

    return { url: result.init_point }; // Devolvemos el link de pago

  } catch (error) {
    console.error(error);
    return { error: "Error creando preferencia de pago" };
  }
}