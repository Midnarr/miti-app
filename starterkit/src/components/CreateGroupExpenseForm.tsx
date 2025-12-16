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

  // Filtramos para que no aparezcas tú mismo en la lista de "deudores"
  // (Tú eres el que paga, no te puedes deber a ti mismo)
  const availableDebtors = members.filter(email => email !== currentUserEmail);

  // Función para obtener nombre bonito
  const getFriendName = (email: string) => {
    const friend = friends.find(f => f.friend_email === email);
    return friend ? friend.friend_name : email.split("@")[0];
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    
    const description = formData.get("description") as string;
    const amountStr = formData.get("amount") as string;
    
    // Obtenemos TODOS los checkboxes marcados
    const selectedDebtors = formData.getAll("debtors") as string[];

    const amount = parseFloat(amountStr);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
      if (!amount || amount <= 0) throw new Error("Ingresa un monto válido.");
      if (!description) throw new Error("Falta la descripción.");
      if (selectedDebtors.length === 0) throw new Error("Selecciona al menos a una persona para dividir.");

      // --- LÓGICA DE DIVISIÓN ---
      // Si el gasto es de $3000 y seleccionas a 2 amigos (más tú = 3 personas):
      // Cada uno debe poner $1000.
      // Tú pagaste $3000, así que te deben $2000 en total ($1000 cada amigo).
      
      const totalPeople = selectedDebtors.length + 1; // Amigos + Tú
      const amountPerPerson = amount / totalPeople;

      // Creamos una lista de promesas para insertar todos los gastos a la vez
      const expensesToInsert = selectedDebtors.map(debtorEmail => ({
        description,
        amount: amountPerPerson,        // Lo que debe ESTA persona
        original_amount: amount,        // El total de la cuenta original
        payer_id: user.id,
        debtor_email: debtorEmail,
        group_id: groupId,
        status: "proposed",             // Estado inicial
      }));

      // Insertamos todo junto
      const { error: insertError } = await supabase
        .from("expenses")
        .insert(expensesToInsert);

      if (insertError) throw insertError;

      formRef.current?.reset();
      router.refresh();
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Pequeña utilidad para marcar todos los checkboxes visualmente
  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkboxes = formRef.current?.querySelectorAll('input[name="debtors"]');
    checkboxes?.forEach((cb: any) => cb.checked = e.target.checked);
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        🍕 Dividir Gasto Grupal
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
           <input 
             name="description" 
             required 
             placeholder="Ej: Asado, Bebidas..." 
             className="w-full border border-gray-300 p-2 rounded-lg text-sm mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" 
           />
        </div>
        
        {/* Monto */}
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase">Monto Total ($)</label>
           <input 
             name="amount" 
             type="number" 
             step="0.01" 
             required 
             placeholder="0.00" 
             className="w-full border border-gray-300 p-2 rounded-lg text-sm mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" 
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
                 <p className="text-xs text-gray-400 italic">No hay otros miembros en este grupo.</p>
               ) : (
                 availableDebtors.map(email => (
                   <label key={email} className="flex items-center gap-3 p-2 hover:bg-white hover:shadow-sm rounded cursor-pointer transition-all">
                     <input 
                       type="checkbox" 
                       name="debtors" 
                       value={email} 
                       className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                     />
                     <div className="text-sm">
                       <span className="font-bold text-gray-700 block">{getFriendName(email)}</span>
                       <span className="text-xs text-gray-400">{email}</span>
                     </div>
                   </label>
                 ))
               )}
           </div>
           <p className="text-[10px] text-gray-400 mt-2 text-center">
             Se dividirá el total entre los seleccionados + tú.
           </p>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm shadow-sm"
        >
          {loading ? "Calculando..." : "Dividir y Crear Gasto"}
        </button>
      </form>
    </div>
  );
}