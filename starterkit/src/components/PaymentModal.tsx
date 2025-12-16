"use client";

import { useState } from "react";
import { createPaymentLink } from "@/app/actions/payment"; // Asegúrate de haber creado este archivo en el paso anterior

interface PaymentModalProps {
  expenseId: string;
  amount: number;
  creditorName: string; // El nombre de quien va a recibir el dinero (tu amigo)
  creditorId: string;   // El ID de usuario de tu amigo (para buscar su token)
  onClose: () => void;
}

export default function PaymentModal({ 
  expenseId, 
  amount, 
  creditorName, 
  creditorId, 
  onClose 
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);

    try {
      // 1. Llamamos a la Server Action para generar la preferencia de pago
      const result = await createPaymentLink(expenseId, amount, creditorId);

      if (result.error) {
        // Si hay error (ej: el amigo no conectó MP), avisamos
        alert("⚠️ " + result.error);
        setLoading(false);
      } else if (result.url) {
        // 2. Si todo sale bien, redirigimos a Mercado Pago
        window.location.href = result.url;
      }
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error inesperado al conectar con Mercado Pago.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-gray-100">
        
        {/* Botón Cerrar */}
        <button 
          onClick={onClose} 
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
        >
          ✕
        </button>
        
        {/* Encabezado */}
        <div className="text-center mb-8 mt-2">
          <div className="h-16 w-16 bg-[#009EE3]/10 text-[#009EE3] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm">
            💸
          </div>
          <h3 className="text-xl font-extrabold text-gray-900">Saldar Deuda</h3>
          <p className="text-gray-500 text-sm mt-1">
            Vas a pagarle a <span className="font-bold text-gray-800">{creditorName}</span>
          </p>
        </div>

        {/* Monto */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 text-center">
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Total a pagar</p>
          <p className="text-4xl font-black text-gray-900 tracking-tight">
            ${amount.toLocaleString("es-AR")}
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-3">
          <button 
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-[#009EE3] hover:bg-[#008ED6] text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              "Pagar con Mercado Pago"
            )}
          </button>
          
          <button 
            onClick={onClose}
            disabled={loading}
            className="block w-full text-gray-500 hover:text-gray-700 font-medium py-2 text-sm transition-colors"
          >
            Cancelar
          </button>
        </div>

        <p className="text-[10px] text-center text-gray-400 mt-6">
          Serás redirigido a una página segura de Mercado Pago.
        </p>

      </div>
    </div>
  );
}