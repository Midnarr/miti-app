"use client";

import { updateExpenseStatus } from "@/app/actions/expenseActions";
import { useState } from "react";

interface Props {
  expenseId: string;
  currentStatus: string;
  isDebtor: boolean; // True si YO debo pagar, False si YO cobro
}

export default function ExpenseStatusButtons({ expenseId, currentStatus, isDebtor }: Props) {
  const [loading, setLoading] = useState(false);

  // Función auxiliar para llamar a la Server Action
  const handleStatusChange = async (newStatus: 'approved' | 'rejected' | 'paid') => {
    setLoading(true);
    try {
      await updateExpenseStatus(expenseId, newStatus);
    } catch (error) {
      alert("Ocurrió un error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <span className="text-xs text-gray-400">Procesando...</span>;

  // CASO 1: Soy el DEUDOR (Me están cobrando)
  if (isDebtor) {
    if (currentStatus === 'pending') {
      return (
        <div className="flex gap-2">
          <button 
            onClick={() => handleStatusChange('approved')}
            className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold hover:bg-green-200 transition"
          >
            Aprobar
          </button>
          <button 
            onClick={() => handleStatusChange('rejected')}
            className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold hover:bg-red-200 transition"
          >
            Rechazar
          </button>
        </div>
      );
    }
    if (currentStatus === 'approved') return <span className="text-xs text-blue-600 font-medium">Esperando pago...</span>;
    if (currentStatus === 'rejected') return <span className="text-xs text-red-600 font-medium">Rechazado por ti</span>;
  }

  // CASO 2: Soy el PAGADOR (Yo creé el gasto y quiero cobrar)
  if (!isDebtor) {
    if (currentStatus === 'pending') return <span className="text-xs text-gray-400 italic">Esperando aprobación...</span>;
    if (currentStatus === 'rejected') return <span className="text-xs text-red-500 font-bold">❌ Te lo rechazaron</span>;
    if (currentStatus === 'approved') {
      return (
        <button 
          onClick={() => handleStatusChange('paid')}
          className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-bold hover:bg-blue-200 transition border border-blue-300"
        >
          Marcar como Pagado
        </button>
      );
    }
  }

  // Si ya está pagado
  if (currentStatus === 'paid') return <span className="text-xs text-green-600 font-bold">✅ Saldado</span>;

  return null;
}