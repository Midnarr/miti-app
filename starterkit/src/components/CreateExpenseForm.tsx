"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

export default function CreateExpenseForm() {
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
    const splitType = formData.get("split_type") === "on"; 
    
    // Archivo (recibo)
    const file = formData.get("receipt") as File;
    let receiptUrl: string | null = null;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("No hay sesión activa.");
      setLoading(false);
      return;
    }

    // 1. VALIDACIÓN: ¿EL USUARIO EXISTE? 🕵️‍♂️
    // Buscamos en la tabla profiles si existe ese email
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", debtorEmail)
      .single();

    if (!profileData) {
      setError(`El usuario "${debtorEmail}" no está registrado en Miti. Pídele que se cree una cuenta primero.`);
      setLoading(false);
      return; // Detenemos todo aquí
    }

    try {
      // 2. Subir imagen si existe
      if (file && file.size > 0) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from("receipts")
          .getPublicUrl(fileName);
          
        receiptUrl = urlData.publicUrl;
      }

      // 3. Crear el Gasto
      const finalAmount = splitType ? amount / 2 : amount;

      const { error: insertError } = await supabase.from("expenses").insert({
        description,
        amount: finalAmount,     
        original_amount: splitType ? amount : finalAmount,
        payer_id: user.id,
        debtor_email: debtorEmail,
        status: "pending",
        receipt_url: receiptUrl,
      });

      if (insertError) throw insertError;

      // Éxito
      formRef.current?.reset();
      router.refresh(); // Refresca la lista de gastos
      setLoading(false);

    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        ✨ Nuevo Gasto (1 a 1)
      </h3>

      {/* Mensaje de Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          🚨 {error}
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descripción</label>
          <input
            name="description"
            type="text"
            required
            placeholder="Cena, Uber..."
            className="w-full border-gray-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Monto Total ($)</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              required
              placeholder="2000"
              className="w-full border-gray-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email del otro</label>
            <input
              name="debtor_email"
              type="email"
              required
              placeholder="amigo@email.com"
              className="w-full border-gray-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              name="split_type"
              type="checkbox"
              defaultChecked
              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600">
              Dividir a la mitad (Tú pagas 50%, él debe 50%)
            </span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Foto del Comprobante</label>
          <input
            name="receipt"
            type="file"
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Verificando..." : "Crear Gasto"}
        </button>
      </form>
    </div>
  );
}