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

  // Función genérica para cambiar el estado
  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("expenses")
      .update({ status: newStatus })
      .eq("id", expenseId);

    if (error) {
      alert("Error al actualizar: " + error.message);
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  // Función de Mercado Pago
  const handlePayWithMP = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/mp/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseId }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else alert("Error: " + (data.error || "Desconocido"));
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // CASO 1: YA ESTÁ PAGADO
  // ---------------------------------------------------------
  if (currentStatus === "paid") {
    return <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded border border-green-100">✅ Pagado</span>;
  }

  // ---------------------------------------------------------
  // CASO 2: ESPERANDO APROBACIÓN (El deudor dijo "Ya pagué")
  // ---------------------------------------------------------
  if (currentStatus === "waiting_approval") {
    if (isPayer) {
      // SI SOY EL ACREEDOR: Debo aprobar o rechazar
      return (
        <div className="flex gap-2 items-center">
          <span className="text-[10px] text-orange-600 font-medium">¿Te pagó?</span>
          <button
            onClick={() => updateStatus("paid")}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded transition-colors"
            title="Confirmar que recibí el dinero"
          >
            {loading ? "..." : "✔ Sí"}
          </button>
          <button
            onClick={() => updateStatus("pending")}
            disabled={loading}
            className="bg-red-100 hover:bg-red-200 text-red-600 text-xs px-2 py-1 rounded transition-colors"
            title="No he recibido nada"
          >
            {loading ? "..." : "✖ No"}
          </button>
        </div>
      );
    } 
    
    if (isDebtor) {
      // SI SOY EL DEUDOR: Solo espero
      return (
        <span className="text-orange-500 text-xs font-medium bg-orange-50 px-2 py-1 rounded border border-orange-100 animate-pulse">
          ⏳ Esperando confirmación...
        </span>
      );
    }
  }

  // ---------------------------------------------------------
  // CASO 3: PENDIENTE (Estado normal)
  // ---------------------------------------------------------
  return (
    <div className="flex gap-2 items-center">
      
      {/* VISTA DEL DEUDOR (Pagar) */}
      {isDebtor && (
        <>
           <button
            onClick={handlePayWithMP}
            disabled={loading}
            className="bg-[#009EE3] hover:bg-[#008ED6] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm transition-transform active:scale-95 flex items-center gap-1"
          >
            {loading ? "..." : "📲 Pagar MP"}
          </button>
          
          <button 
            onClick={() => updateStatus("waiting_approval")} 
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 text-[10px] underline decoration-gray-300 hover:decoration-gray-500"
          >
            Avísé que pagué (Efectivo)
          </button>
        </>
      )}

      {/* VISTA DEL ACREEDOR (Cobrar) */}
      {isPayer && (
        <button
          onClick={() => updateStatus("paid")}
          disabled={loading}
          className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-medium px-2 py-1 rounded-md transition-colors"
        >
          {loading ? "..." : "Marcar como cobrado"}
        </button>
      )}
    </div>
  );
}