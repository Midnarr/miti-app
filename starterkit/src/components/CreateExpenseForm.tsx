"use client";

import { createClient } from "@/libs/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateExpenseForm() {
  const [loading, setLoading] = useState(false);
  const [splitHalf, setSplitHalf] = useState(true); 

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const description = formData.get("description") as string;
    const inputAmount = parseFloat(formData.get("amount") as string);
    const debtorEmail = formData.get("debtorEmail") as string;
    const file = formData.get("receipt") as File;

    const finalDebtAmount = splitHalf ? inputAmount / 2 : inputAmount;
    let receiptUrl = null;

    try {
      // 1. SUBIDA DE IMAGEN
      if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        // Creamos un nombre único: fecha + random + extensión
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(fileName, file);

        if (uploadError) throw new Error("Error subiendo imagen: " + uploadError.message);

        const { data } = supabase.storage
          .from("receipts")
          .getPublicUrl(fileName);
          
        receiptUrl = data.publicUrl;
      }

      // 2. GUARDAR GASTO EN DB
      const { error } = await supabase.from("expenses").insert({
        description,
        amount: finalDebtAmount,
        original_amount: inputAmount,
        debtor_email: debtorEmail,
        receipt_url: receiptUrl, // Guardamos la URL
      });

      if (error) throw error;

      router.refresh();
      (e.target as HTMLFormElement).reset();
      setSplitHalf(true);

    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border">
      <h3 className="font-bold text-lg mb-4">✨ Nuevo Gasto (1 a 1)</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Descripción</label>
          <input name="description" required placeholder="Cena, Uber..." className="w-full border rounded p-2 text-sm" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Monto Total ($)</label>
            <input name="amount" type="number" step="0.01" required placeholder="2000" className="w-full border rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium">Email del otro</label>
            <input name="debtorEmail" type="email" required placeholder="amigo@email.com" className="w-full border rounded p-2 text-sm" />
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
          <input 
            type="checkbox" 
            id="splitCheck"
            checked={splitHalf}
            onChange={(e) => setSplitHalf(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="splitCheck" className="text-sm text-gray-700 select-none cursor-pointer">
            Dividir a la mitad (Tú pagas 50%, él debe 50%)
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Foto del Comprobante</label>
          <input 
            name="receipt" 
            type="file" 
            accept="image/*" 
            className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
          />
        </div>

        <button disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50 font-medium">
          {loading ? "Subiendo..." : "Crear Gasto"}
        </button>
      </form>
    </div>
  );
}