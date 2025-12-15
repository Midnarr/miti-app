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
  members: string[]; // ✅ CORRECTO: Aceptamos lista de textos
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

      // Insertamos el gasto
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

  // Filtramos para que no te cobres a ti mismo
  const availableDebtors = members.filter(email => email !== currentUserEmail);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
      <h3 className="font-bold text-gray-800 mb-4">💸 Nuevo Gasto</h3>
      
      {error && <p className="text-red-500 text-xs mb-3 font-medium bg-red-50 p-2 rounded">{error}</p>}

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
           <input name="description" required placeholder="Ej: Supermercado" className="w-full border border-gray-300 p-2 rounded-lg text-sm mt-1" />
        </div>
        
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase">Monto Total</label>
           <input name="amount" type="number" step="0.01" required placeholder="0.00" className="w-full border border-gray-300 p-2 rounded-lg text-sm mt-1" />
        </div>

        <div>
           <label className="text-xs font-bold text-gray-500 uppercase">Cobrar la mitad a:</label>
           <select name="debtor_email" required className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-white mt-1">
               <option value="">Selecciona...</option>
               {availableDebtors.map(email => (
                 <option key={email} value={email}>{email}</option>
               ))}
           </select>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm">
          {loading ? "Guardando..." : "Registrar Gasto"}
        </button>
      </form>
    </div>
  );
}