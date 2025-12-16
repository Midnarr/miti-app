import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const expenseId = requestUrl.searchParams.get("expenseId");
  
  if (expenseId) {
    const supabase = await createClient();
    
    // Marcar como pagado
    await supabase
      .from("expenses")
      .update({ status: "paid" })
      .eq("id", expenseId);
  }

  // Volver al dashboard con fiesta
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=payment_completed`);
}