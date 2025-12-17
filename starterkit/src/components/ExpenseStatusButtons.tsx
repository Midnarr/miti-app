"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

export default function ExpenseStatusButtons({ 
  expenseId, 
  currentStatus, 
  isDebtor,
  isPayer,
  paymentMethod, // "mp_link", "transfer" o "cash"
  paymentDetails // El Alias/CBU o null
}: { 
  expenseId: string, 
  currentStatus: string, 
  isDebtor: boolean,
  isPayer: boolean,
  paymentMethod?: string,
  paymentDetails?: string | null
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Función para cambiar estado (Avisar pago / Aprobar / Rechazar)
  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("expenses")
      .update({ status: newStatus })
      .eq("id", expenseId);

    if (error) {
      alert("Error: " + error.message);
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  // Función exclusiva para Mercado Pago
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
  // 1. ESTADO: PAGADO (Final)
  // ---------------------------------------------------------
  if (currentStatus === "paid") {
    return <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded border border-green-100">✅ Pagado</span>;
  }

  // ---------------------------------------------------------
  // 2. ESTADO: ESPERANDO APROBACIÓN (Semáforo)
  // ---------------------------------------------------------
  if (currentStatus === "waiting_approval") {
    if (isPayer) {
      // El acreedor tiene que aprobar
      return (
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-orange-600 font-bold animate-pulse">¿Confirmas que recibiste el pago?</span>
          <div className="flex gap-2">
            <button
              onClick={() => updateStatus("paid")}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded shadow-sm"
            >
              ✔ Sí, recibí
            </button>
            <button
              onClick={() => updateStatus("pending")}
              disabled={loading}
              className="bg-red-100 hover:bg-red-200 text-red-600 text-xs px-3 py-1 rounded"
            >
              ✖ No
            </button>
          </div>
        </div>
      );
    } 
    if (isDebtor) {
      return (
        <span className="text-orange-500 text-xs font-medium bg-orange-50 px-2 py-1 rounded border border-orange-100 flex items-center gap-1">
          ⏳ Esperando que te aprueben...
        </span>
      );
    }
  }

  // ---------------------------------------------------------
  // 3. ESTADO: PENDIENTE (Aquí discriminamos por método)
  // ---------------------------------------------------------
  
  // VISTA DEL ACREEDOR (Siempre puede marcar como pagado manualmente)
  if (isPayer) {
    return (
      <button
        onClick={() => updateStatus("paid")}
        disabled={loading}
        className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-medium px-2 py-1 rounded-md"
      >
        Marcar como cobrado
      </button>
    );
  }

  // VISTA DEL DEUDOR (Depende del método elegido por el acreedor)
  if (isDebtor) {
    
    // CASO A: TRANSFERENCIA
    if (paymentMethod === "transfer") {
      return (
        <div className="flex flex-col items-end gap-2 w-full">
          {/* Mostramos el CBU aquí para que sea fácil copiar */}
          <div className="text-right">
             <span className="text-[10px] text-gray-500 block">Transferir a:</span>
             <code className="text-xs bg-purple-50 text-purple-700 px-1 py-0.5 rounded border border-purple-100 font-mono block select-all">
                {paymentDetails || "Consultar Alias"}
             </code>
          </div>
          <button
            onClick={() => updateStatus("waiting_approval")}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1"
          >
            {loading ? "..." : "🏦 Ya transferí, avísale"}
          </button>
        </div>
      );
    }

    // CASO B: MERCADO PAGO (APP)
    if (paymentMethod === "mp_link") {
      return (
        <div className="flex flex-col items-end gap-1">
            <button
                onClick={handlePayWithMP}
                disabled={loading}
                className="bg-[#009EE3] hover:bg-[#008ED6] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm active:scale-95 flex items-center gap-1"
            >
                {loading ? "..." : "📲 Pagar con MP"}
            </button>
            {/* Opción secundaria por si MP falla o pagan por fuera */}
            <button 
                onClick={() => updateStatus("waiting_approval")} 
                className="text-[10px] text-gray-400 hover:text-gray-600 underline"
            >
                Pagué por fuera
            </button>
        </div>
      );
    }

    // CASO C: EFECTIVO (CASH)
    // O cualquier otro caso por defecto
    return (
      <div className="flex flex-col items-end">
        <span className="text-[10px] text-gray-500 mb-1">Pago en efectivo</span>
        <button
            onClick={() => updateStatus("waiting_approval")}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm"
        >
            {loading ? "..." : "💵 Ya te pagué"}
        </button>
      </div>
    );
  }

  return null;
}