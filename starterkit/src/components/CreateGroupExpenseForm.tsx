"use client";

import { createClient } from "@/libs/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  groupId: string;
  members: { id: string; user_email: string }[];
  currentUserEmail: string;
}

export default function CreateGroupExpenseForm({ groupId, members, currentUserEmail }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const friends = members.filter(m => m.user_email !== currentUserEmail);
  const totalMembersCount = members.length;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const description = formData.get("description") as string;
    const totalAmount = parseFloat(formData.get("amount") as string);
    const selectedDebtor = formData.get("debtorEmail") as string;
    const file = formData.get("receipt") as File;

    if (!selectedDebtor) { alert("Selecciona a quién cobrarle"); setLoading(false); return; }
    if (isNaN(totalAmount) || totalAmount <= 0) { alert("Monto inválido"); setLoading(false); return; }

    let receiptUrl: string | null = null;

    try {
      // 1. SUBIDA DE IMAGEN
      if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
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

      // 2. LÓGICA DE GASTOS
      if (selectedDebtor === "SPLIT_ALL") {
        // Dividir entre todos
        const amountPerPerson = totalAmount / totalMembersCount;
        
        const expensesToCreate = friends.map(friend => {
          return supabase.from("expenses").insert({
            description: `${description} (Dividido)`,
            amount: amountPerPerson,
            original_amount: totalAmount, // Guardamos el total del ticket
            debtor_email: friend.user_email,
            receipt_url: receiptUrl, // <--- La misma URL para todos
            group_id: groupId,
          });
        });
        await Promise.all(expensesToCreate);

      } else {
        // Cobrar a uno solo
        await supabase.from("expenses").insert({
          description,
          amount: totalAmount,
          original_amount: totalAmount,
          debtor_email: selectedDebtor,
          receipt_url: receiptUrl,
          group_id: groupId,
        });
      }

      router.refresh();
      (e.target as HTMLFormElement).reset();

    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border h-fit">
      <h3 className="font-bold text-gray-700 mb-4">💸 Agregar Gasto al Grupo</h3>
      
      {friends.length === 0 ? (
        <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded">
          ⚠️ Invita amigos al grupo para dividir gastos.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <input name="description" required placeholder="Ej: Asado, Bebidas..." className="w-full border rounded p-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Monto Total ($)</label>
              <input name="amount" type="number" step="0.01" required placeholder="0.00" className="w-full border rounded p-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">¿A quién cobras?</label>
              <select name="debtorEmail" required className="w-full border rounded p-2 text-sm bg-white cursor-pointer">
                <option value="">Seleccionar...</option>
                <option value="SPLIT_ALL" className="font-bold text-indigo-600">⚡ Dividir entre todos ({totalMembersCount})</option>
                <hr />
                {friends.map(m => (
                  <option key={m.id} value={m.user_email}>Solo a {m.user_email}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto (Opcional)</label>
            <input 
              name="receipt" 
              type="file" 
              accept="image/*" 
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" 
            />
          </div>

          <button disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50 text-sm font-bold shadow-sm">
            {loading ? "Subiendo..." : "Crear Gasto"}
          </button>
        </form>
      )}
    </div>
  );
}