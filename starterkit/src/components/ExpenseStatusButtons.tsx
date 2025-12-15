"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExpenseStatusButtons({
  expenseId,
  currentStatus,
  isDebtor
}: {
  expenseId: string;
  currentStatus: string;
  isDebtor: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleStatus = async () => {
    setLoading(true);
    const supabase = createClient();
    const newStatus = currentStatus === "pending" ? "paid" : "pending";

    try {
      await supabase
        .from("expenses")
        .update({ status: newStatus })
        .eq("id", expenseId);

      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Solo mostramos el botón si eres el deudor (para pagar) o si ya está pagado (para deshacer)
  // O puedes quitar la condición "isDebtor" si quieres que cualquiera pueda marcarlo.
  
  return (
    <button
      onClick={toggleStatus}
      disabled={loading}
      className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${
        currentStatus === "paid"
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-orange-100 text-orange-700 hover:bg-orange-200"
      }`}
    >
      {loading ? "..." : currentStatus === "paid" ? "✅ PAGADO" : "⏳ MARCAR PAGADO"}
    </button>
  );
}