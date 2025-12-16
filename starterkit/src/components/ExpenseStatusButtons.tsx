"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

export default function ExpenseStatusButtons({ 
  expenseId, 
  currentStatus, 
  isDebtor,
  isPayer 
}: { 
  expenseId: string, 
  currentStatus: string, 
  isDebtor: boolean,
  isPayer: boolean 
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Función para marcar como pagado manualmente (para efectivo/transferencia)
  const markAsPaid = async () => {
    setLoading(true);
    await supabase.from("expenses").update({ status: "paid" }).eq("id", expenseId);
    router.refresh();
    setLoading(false);
  };

  // 👇 NUEVA FUNCIÓN: Pagar con Mercado Pago
  const handlePayWithMP = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/mp/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseId }),
      });

      const data = await response.json();

      if (data.error) {
        alert("Error: " + data.error);
        setLoading(false);
      } else if (data.url) {
        // Redirigir a Mercado Pago
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al conectar con Mercado Pago");
      setLoading(false);
    }
  };

  if (currentStatus === "paid") {
    return <span className="text-green-600 font-bold text-sm bg-green-50 px-2 py-1 rounded">✅ Pagado</span>;
  }

  return (
    <div className="flex gap-2">
      {/* Si yo debo pagar, muestro opción de MP */}
      {isDebtor && (
        <>
           <button
            onClick={handlePayWithMP}
            disabled={loading}
            className="bg-[#009EE3] hover:bg-[#008ED6] text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
          >
            {loading ? "..." : "📲 Pagar con MP"}
          </button>
          
          {/* Opción manual por si pagan en efectivo */}
          <button 
            onClick={markAsPaid} 
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 text-[10px] underline"
          >
            Marcar pagado (Efectivo)
          </button>
        </>
      )}

      {/* Si a mí me deben, solo puedo marcar como pagado manual */}
      {isPayer && (
        <button
          onClick={markAsPaid}
          disabled={loading}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
        >
          {loading ? "..." : "Marcar como cobrado"}
        </button>
      )}
    </div>
  );
}