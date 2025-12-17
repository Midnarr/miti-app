import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const expenseId = requestUrl.searchParams.get("expenseId");
  
  // Mercado Pago envía estos datos en la URL al volver
  const status = requestUrl.searchParams.get("collection_status"); // 'approved', 'rejected', etc.
  const paymentId = requestUrl.searchParams.get("payment_id");

  // 1. Verificamos que realmente se haya aprobado el pago
  if (status === "approved" && expenseId) {
    
    // 2. Usamos la LLAVE MAESTRA para actualizar la base de datos
    // (Usamos service_role porque a veces el deudor no tiene permisos de escritura en la fila del gasto)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Actualizamos el estado a 'paid'
    const { error } = await supabaseAdmin
      .from("expenses")
      .update({ status: "paid" }) // Forzamos el estado a pagado
      .eq("id", expenseId);

    if (error) {
      console.error("Error actualizando pago:", error);
      // Podrías redirigir a una página de error, pero por ahora lo mandamos al dashboard
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=db_update_failed`);
    }
    
    // 4. ¡Éxito! Volvemos al dashboard con fiesta
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=payment_completed`);
  }

  // Si el pago no fue aprobado o algo falló
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?error=payment_failed`);
}