"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

// CORRECCIÓN: 'members' ahora acepta una lista simple de emails (strings)
export default function CreateGroupExpenseForm({
  groupId,
  members,
  currentUserEmail,
}: {
  groupId: string;
  members: string[]; // <--- ESTO SOLUCIONA EL ERROR ROJO
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
    const amount = parseFloat(formData.get("amount") as string);
    const debtorEmail = formData.get("debtor_email") as string;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
      if (!amount || amount <= 0) throw new Error("Ingresa un monto válido.");
      if (!description) throw new Error("Ingresa una descripción.");
      if (!debtorEmail) throw new Error("Selecciona a quién cobrarle.");

      // Lógica: Se divide a la mitad entre el pagador y el deudor
      const finalAmount = amount / 2; 

      const { error: insertError } = await supabase.from("expenses").insert({
        description,
        amount: finalAmount, // Lo que debe el otro
        original_amount: amount, // Lo que costó total
        payer_id: user.id,
        debtor_email: debtorEmail, // Guardamos el email directamente
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

  // Filtramos para no mostrarte a ti mismo en el selector
  const availableDebtors = members.filter(email => email !== currentUserEmail);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        💸 Nuevo Gasto Grupal
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100">
          {error}
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
          <input
            name="description"
            type="text"
            required
            placeholder="Ej: Compras del super"
            className="w-full rounded-lg border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto Total ($)</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            className="w-full rounded-lg border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cobrar la mitad a:</label>
          <select 
            name="debtor_email" 
            required
            className="w-full rounded-lg border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Selecciona un miembro...</option>
            {availableDebtors.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Registrar Gasto"}
        </button>
      </form>
    </div>
  );
}