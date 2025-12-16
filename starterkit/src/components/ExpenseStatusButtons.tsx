"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExpenseStatusButtons({
  expenseId,
  currentStatus,
  isDebtor,
  isPayer
}: {
  expenseId: string;
  currentStatus: string;
  isDebtor: boolean;
  isPayer: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Función 1: El deudor acepta la deuda
  const acceptExpense = async () => {
    setLoading(true);
    await supabase.from("expenses").update({ status: "pending" }).eq("id", expenseId);
    setLoading(false);
    router.refresh();
  };

  // Función 2: El cobrador confirma el pago
  const markAsPaid = async () => {
    setLoading(true);
    await supabase.from("expenses").update({ status: "paid" }).eq("id", expenseId);
    setLoading(false);
    router.refresh();
  };

  // ESTADO 1: PROPUESTO (Recién creado)
  if (currentStatus === "proposed") {
    if (isDebtor) {
      return (
        <button
          onClick={acceptExpense}
          disabled={loading}
          className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          {loading ? "..." : "👍 Aceptar Deuda"}
        </button>
      );
    }
    if (isPayer) {
      return (
        <span className="text-gray-400 text-xs italic bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
          ⏳ Esperando que acepten
        </span>
      );
    }
  }

  // ESTADO 2: PENDIENTE (Aceptado, esperando pago)
  if (currentStatus === "pending") {
    if (isPayer) {
      return (
        <button
          onClick={markAsPaid}
          disabled={loading}
          className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-bold hover:bg-green-700 transition-colors shadow-sm"
        >
          {loading ? "..." : "💰 Confirmar Cobro"}
        </button>
      );
    }
    if (isDebtor) {
      return (
        <span className="text-orange-600 text-xs font-bold bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
          💸 Tienes que pagar
        </span>
      );
    }
  }

  // ESTADO 3: PAGADO
  if (currentStatus === "paid") {
    return (
      <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full border border-green-100 flex items-center gap-1">
        ✅ Pagado
      </span>
    );
  }

  return null;
}