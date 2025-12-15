"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

// RECIBIMOS LA LISTA DE AMIGOS COMO PROP
export default function CreateExpenseForm({
  currentUserEmail,
  friends // <--- NUEVA PROP
}: {
  currentUserEmail: string;
  friends: any[]; // <--- NUEVA PROP
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
    const debtorEmail = formData.get("debtor_email") as string; // Ahora vendrá del Select
    const split = formData.get("split") === "on";

    const amount = parseFloat(amountStr);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
      if (!amount || !description || !debtorEmail) throw new Error("Completa todos los campos");
      
      const finalAmount = split ? amount / 2 : amount;

      const { error: insertError } = await supabase.from("expenses").insert({
        description,
        amount: finalAmount,
        original_amount: amount,
        payer_id: user.id,
        debtor_email: debtorEmail,
        group_id: null,
        status: "proposed",
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

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 h-fit">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        ✨ Nuevo Gasto (1 a 1)
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
            placeholder="Cena, Uber..."
            className="w-full rounded-lg border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto ($)</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              className="w-full rounded-lg border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {/* AQUÍ ESTÁ EL CAMBIO: SELECTOR DE AMIGOS */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amigo</label>
            <select
              name="debtor_email"
              required
              className="w-full rounded-lg border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Selecciona...</option>
              {friends.map(f => (
                <option key={f.id} value={f.friend_email}>
                  {f.friend_name} ({f.friend_email})
                </option>
              ))}
            </select>
            {friends.length === 0 && (
              <p className="text-[10px] text-red-500 mt-1">¡Agrega amigos en tu agenda primero!</p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" name="split" defaultChecked className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"/>
            <div className="text-sm text-gray-700">
              <span className="font-medium block">Dividir a la mitad</span>
              <span className="text-xs text-gray-500">Tú pagas 50%, él debe 50%</span>
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Crear Gasto"}
        </button>
      </form>
    </div>
  );
}