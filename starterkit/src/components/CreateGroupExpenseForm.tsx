"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

export default function CreateGroupExpenseForm({
  groupId,
  members,
  currentUserEmail,
}: {
  groupId: string;
  members: string[]; // <--- LISTA DE STRINGS SIMPLE
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

    const amount = parseFloat(amountStr);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
      if (!amount || !description || !debtorEmail) throw new Error("Completa todos los campos");

      const { error: insertError } = await supabase.from("expenses").insert({
        description,
        amount: amount / 2, // Lógica simple: dividir a la mitad
        original_amount: amount,
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

  const availableDebtors = members.filter(email => email !== currentUserEmail);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
      <h3 className="font-bold text-gray-800 mb-4">💸 Nuevo Gasto</h3>
      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <input name="description" required placeholder="Descripción" className="w-full border p-2 rounded text-sm" />
        <input name="amount" type="number" required placeholder="Monto" className="w-full border p-2 rounded text-sm" />
        <select name="debtor_email" required className="w-full border p-2 rounded text-sm bg-white">
            <option value="">Cobrar a...</option>
            {availableDebtors.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50">
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}