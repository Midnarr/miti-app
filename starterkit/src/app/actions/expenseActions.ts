"use server";

import { createClient } from "@/libs/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateExpenseStatus(expenseId: string, newStatus: 'approved' | 'rejected' | 'paid') {
  const supabase = await createClient();
  
  // 1. Ejecutamos la actualización
  // Gracias a las RLS (políticas de seguridad) que creamos en SQL, 
  // Supabase solo permitirá esto si el usuario es el pagador o el deudor correcto.
  const { error } = await supabase
    .from("expenses")
    .update({ status: newStatus })
    .eq("id", expenseId);

  if (error) {
    console.error("Error actualizando gasto:", error);
    throw new Error("No se pudo actualizar el gasto");
  }

  // 2. Refrescamos el dashboard para que se vea el cambio inmediatamente
  revalidatePath("/dashboard");
}