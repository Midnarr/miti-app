"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

export default function CreateGroupExpenseForm({
  groupId,
  members,
  currentUserEmail,
  friends = [] // 👈 Recibimos la lista (con valor por defecto)
}: {
  groupId: string;
  members: string[];
  currentUserEmail: string;
  friends?: any[]; // Prop opcional
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ... (función handleSubmit igual que antes) ...
  const handleSubmit = async (formData: FormData) => {
      // ... (código del submit idéntico al anterior) ...
      // Copia el submit de tu archivo anterior o el que te pasé en respuestas pasadas
      // Lo importante es la parte visual del return
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
          amount: amount / 2,
          original_amount: amount,
          payer_id: user.id,
          debtor_email: debtorEmail,
          group_id: groupId,
          status: "proposed", // Recordar que ahora usamos 'proposed'
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

  // Función auxiliar para encontrar el nombre de un email
  const getFriendName = (email: string) => {
    const friend = friends.find(f => f.friend_email === email);
    return friend ? friend.friend_name : email; // Si es amigo devuelve nombre, si no, el email
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
      <h3 className="font-bold text-gray-800 mb-4">💸 Nuevo Gasto de Grupo</h3>
      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
      
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        {/* ... inputs de descripción y monto iguales ... */}
        <input name="description" required placeholder="Descripción" className="w-full border p-2 rounded text-sm" />
        <input name="amount" type="number" step="0.01" required placeholder="Monto" className="w-full border p-2 rounded text-sm" />

        {/* SELECTOR MEJORADO */}
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase">Cobrar la mitad a:</label>
           <select name="debtor_email" required className="w-full border p-2 rounded text-sm bg-white mt-1">
               <option value="">Selecciona miembro...</option>
               {availableDebtors.map(email => (
                 <option key={email} value={email}>
                   {getFriendName(email)} {/* 👈 Aquí mostramos el nombre bonito */}
                 </option>
               ))}
           </select>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 disabled:opacity-50">
          {loading ? "Guardando..." : "Registrar Gasto"}
        </button>
      </form>
    </div>
  );
}