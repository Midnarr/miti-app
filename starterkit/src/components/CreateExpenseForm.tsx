"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

export default function CreateExpenseForm({
  currentUserEmail,
  friends = []
}: {
  currentUserEmail: string;
  friends?: any[];
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
    const split = formData.get("split") === "on";
    const file = formData.get("receipt") as File; // 👈 Archivo

    const amount = parseFloat(amountStr);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
      if (!amount || !description || !debtorEmail) throw new Error("Completa todos los campos");
      
      const finalAmount = split ? amount / 2 : amount;

      // 1. SUBIDA DE IMAGEN
      let receiptUrl = null;
      if (file && file.size > 0) {
        if (file.size > 5 * 1024 * 1024) throw new Error("La imagen es muy pesada (máx 5MB).");
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('receipts').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath);
        receiptUrl = urlData.publicUrl;
      }

      // 2. INSERTAR GASTO
      const { error: insertError } = await supabase.from("expenses").insert({
        description,
        amount: finalAmount,
        original_amount: amount,
        payer_id: user.id,
        debtor_email: debtorEmail,
        group_id: null,
        status: "proposed",
        receipt_url: receiptUrl // 👈 Guardamos URL
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
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">✨ Nuevo Gasto (1 a 1)</h3>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100">{error}</div>}

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
          <input name="description" required placeholder="Cena, Uber..." className="w-full border p-2 rounded text-sm mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Monto ($)</label>
            <input name="amount" type="number" step="0.01" required placeholder="0.00" className="w-full border p-2 rounded text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Amigo</label>
            <select name="debtor_email" required className="w-full border p-2 rounded text-sm bg-white mt-1">
              <option value="">Selecciona...</option>
              {friends.map(f => (
                <option key={f.id} value={f.friend_email}>{f.friend_name} ({f.friend_email})</option>
              ))}
            </select>
          </div>
        </div>

        {/* INPUT DE ARCHIVO */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Ticket (Opcional)</label>
          <input type="file" name="receipt" accept="image/*" className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
        </div>

        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" name="split" defaultChecked className="mt-1 h-4 w-4 text-indigo-600 rounded"/>
            <div className="text-sm text-gray-700">
              <span className="font-medium block">Dividir a la mitad</span>
              <span className="text-xs text-gray-500">Tú pagas 50%, él debe 50%</span>
            </div>
          </label>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm">
          {loading ? "Subiendo..." : "Crear Gasto"}
        </button>
      </form>
    </div>
  );
}