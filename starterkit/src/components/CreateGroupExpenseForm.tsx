"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

export default function CreateGroupExpenseForm({
  groupId,
  members,
  currentUserEmail,
  friends = []
}: {
  groupId: string;
  members: string[];
  currentUserEmail: string;
  friends?: any[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableDebtors = members.filter(email => email !== currentUserEmail);

  const getFriendName = (email: string) => {
    const friend = friends.find(f => f.friend_email === email);
    return friend ? friend.friend_name : email.split("@")[0];
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    
    const description = formData.get("description") as string;
    const amountStr = formData.get("amount") as string;
    const selectedDebtors = formData.getAll("debtors") as string[];
    const file = formData.get("receipt") as File; // 👈 OBTENEMOS EL ARCHIVO

    const amount = parseFloat(amountStr);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
      if (!amount || amount <= 0) throw new Error("Ingresa un monto válido.");
      if (!description) throw new Error("Falta la descripción.");
      if (selectedDebtors.length === 0) throw new Error("Selecciona al menos a una persona.");

      // --- 1. SUBIDA DE IMAGEN (Si existe) ---
      let receiptUrl = null;
      
      if (file && file.size > 0) {
        // Validar tamaño (ej: máx 5MB)
        if (file.size > 5 * 1024 * 1024) throw new Error("La imagen es muy pesada (máx 5MB).");

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`; // Carpeta por usuario para ordenar

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Obtener la URL pública para guardarla
        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath);
          
        receiptUrl = urlData.publicUrl;
      }

      // --- 2. LOGICA DE DIVISIÓN ---
      const totalPeople = selectedDebtors.length + 1;
      const amountPerPerson = amount / totalPeople;

      const expensesToInsert = selectedDebtors.map(debtorEmail => ({
        description,
        amount: amountPerPerson,
        original_amount: amount,
        payer_id: user.id,
        debtor_email: debtorEmail,
        group_id: groupId,
        status: "proposed",
        receipt_url: receiptUrl, // 👈 GUARDAMOS LA URL AQUÍ
      }));

      const { error: insertError } = await supabase
        .from("expenses")
        .insert(expensesToInsert);

      if (insertError) throw insertError;

      formRef.current?.reset();
      router.refresh();
      
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkboxes = formRef.current?.querySelectorAll('input[name="debtors"]');
    checkboxes?.forEach((cb: any) => cb.checked = e.target.checked);
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        🧾 Nuevo Gasto
      </h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100 font-medium">
          ⚠️ {error}
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        
        {/* Descripción */}
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
           <input name="description" required placeholder="Ej: Cena" className="w-full border border-gray-300 p-2 rounded-lg text-sm mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        
        {/* Monto */}
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase">Monto Total ($)</label>
           <input name="amount" type="number" step="0.01" required placeholder="0.00" className="w-full border border-gray-300 p-2 rounded-lg text-sm mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>

        {/* FOTO DEL COMPROBANTE (NUEVO) */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Foto del Ticket (Opcional)</label>
          <input 
            type="file" 
            name="receipt" 
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
        </div>

        {/* SELECCIÓN DE MIEMBROS */}
        <div>
           <div className="flex justify-between items-end mb-2">
             <label className="text-xs font-bold text-gray-500 uppercase">Dividir entre:</label>
             <label className="text-xs text-indigo-600 flex items-center gap-1 cursor-pointer font-medium hover:underline">
               <input type="checkbox" onChange={toggleAll} className="rounded text-indigo-600 focus:ring-indigo-500" />
               Todos
             </label>
           </div>
           
           <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto space-y-2">
               {availableDebtors.length === 0 ? (
                 <p className="text-xs text-gray-400 italic">No hay otros miembros.</p>
               ) : (
                 availableDebtors.map(email => (
                   <label key={email} className="flex items-center gap-3 p-2 hover:bg-white hover:shadow-sm rounded cursor-pointer transition-all">
                     <input type="checkbox" name="debtors" value={email} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                     <div className="text-sm">
                       <span className="font-bold text-gray-700 block">{getFriendName(email)}</span>
                       <span className="text-xs text-gray-400">{email}</span>
                     </div>
                   </label>
                 ))
               )}
           </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm shadow-sm">
          {loading ? "Subiendo..." : "Dividir y Crear"}
        </button>
      </form>
    </div>
  );
}