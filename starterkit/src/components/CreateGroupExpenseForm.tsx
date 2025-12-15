"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

// Actualizamos para aceptar array de strings (emails)
export default function CreateGroupExpenseForm({
  groupId,
  members, 
  currentUserEmail,
}: {
  groupId: string;
  members: string[]; // <--- ESTO ARREGLA LA LÍNEA ROJA DE VS CODE
  currentUserEmail: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    
    const description = formData.get("description") as string;
    const amountStr = formData.get("amount") as string;
    const debtorEmail = formData.get("debtor_email") as string;

    if (!amountStr || !description || !debtorEmail) {
      setError("Por favor completa todos los campos");
      setLoading(false);
      return;
    }

    const amount = parseFloat(amountStr);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
      // Cálculo simple: la mitad para cada uno
      const finalAmount = amount / 2; 

      const { error: insertError } = await supabase.from("expenses").insert({
        description,
        amount: finalAmount, // Lo que te deben
        original_amount: amount, // Costo total
        payer_id: user.id,
        debtor_email: debtorEmail,
        group_id: groupId,
        status: "pending",
      });

      if (insertError) throw insertError;

      formRef.current?.reset();
      router.refresh();
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar para no cobrarme a mí mismo
  const availableDebtors = members.filter(email => email !== currentUserEmail);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
      <h3 className="font-bold text-gray-800 mb-4">💸 Nuevo Gasto</h3>
      
      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
          <input name="description" required className="w-full border p-2 rounded text-sm" placeholder="Ej: Cena" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto ($)</label>
          <input name="amount" type="number" step="0.01" required className="w-full border p-2 rounded text-sm" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cobrar a:</label>
          <select name="debtor_email" required className="w-full border p-2 rounded text-sm bg-white">
            <option value="">Elegir...</option>
            {availableDebtors.map(email => (
              <option key={email} value={email}>{email}</option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50">
          {loading ? "Guardando..." : "Guardar Gasto"}
        </button>
      </form>
    </div>
  );
}