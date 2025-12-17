"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

interface Friend {
  id: string;
  friend_email: string;
  friend_name: string;
}

// 👇 Nueva interfaz
interface PaymentMethod {
  id: string;
  platform_name: string;
  alias_cbu: string;
}

export default function CreateExpenseForm({ 
  currentUserEmail, 
  friends,
  myPaymentMethods // 👇 Recibimos esto
}: { 
  currentUserEmail: string; 
  friends: Friend[];
  myPaymentMethods: PaymentMethod[];
}) {
  const supabase = createClient();
  const router = useRouter();

  // Estados previos...
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [splitEvenly, setSplitEvenly] = useState(true);
  const [loading, setLoading] = useState(false);

  // 👇 NUEVOS ESTADOS DE COBRO
  const [paymentType, setPaymentType] = useState<"mp_link" | "transfer" | "cash">("mp_link");
  const [selectedAliasId, setSelectedAliasId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!description || !amount || !selectedFriendId) {
        alert("Faltan datos.");
        setLoading(false);
        return;
      }

      // Validar Transferencia
      let finalDetails = null;
      if (paymentType === "transfer") {
        if (!selectedAliasId) {
          alert("Si eliges Transferencia, debes seleccionar a qué cuenta quieres que te envíen.");
          setLoading(false);
          return;
        }
        // Guardamos el texto del alias directamente en el gasto (Snapshot)
        const method = myPaymentMethods.find(m => m.id === selectedAliasId);
        finalDetails = `${method?.platform_name}: ${method?.alias_cbu}`;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No auth");

      const totalAmount = parseFloat(amount);
      const debtAmount = splitEvenly ? (totalAmount / 2) : totalAmount;
      const friendData = friends.find(f => f.id === selectedFriendId);

      const { error } = await supabase.from("expenses").insert({
        description,
        original_amount: totalAmount,
        amount: debtAmount,
        payer_id: user.id,
        debtor_email: friendData?.friend_email,
        status: "pending",
        
        // 👇 CAMPOS NUEVOS
        payment_method_type: paymentType, // 'cash', 'transfer', 'mp_link'
        payment_details: finalDetails,    // "Naranja X: mi.alias" o null

        group_id: null
      });

      if (error) throw error;

      setDescription("");
      setAmount("");
      setPaymentType("mp_link"); // Resetear
      router.refresh();

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-4">✨ Nuevo Gasto</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* ... Inputs de Descripción y Monto y Amigo (Igual que antes) ... */}
        <input 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Descripción" 
            className="w-full border p-2 rounded" 
        />
        <div className="grid grid-cols-2 gap-4">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full border p-2 rounded" />
            <select value={selectedFriendId} onChange={e => setSelectedFriendId(e.target.value)} className="w-full border p-2 rounded">
                <option value="">Seleccionar Amigo...</option>
                {friends.map(f => <option key={f.id} value={f.id}>{f.friend_name}</option>)}
            </select>
        </div>

        {/* 👇 SELECCIÓN DE MÉTODO DE COBRO (NUEVO) */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">¿Cómo quieres cobrar esto?</label>
            
            <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                    type="button"
                    onClick={() => setPaymentType("mp_link")}
                    className={`text-xs py-2 px-1 rounded border ${paymentType === "mp_link" ? "bg-blue-100 border-blue-500 text-blue-700 font-bold" : "bg-white border-gray-200 text-gray-600"}`}
                >
                    📲 Mercado Pago (App)
                </button>
                <button
                    type="button"
                    onClick={() => setPaymentType("transfer")}
                    className={`text-xs py-2 px-1 rounded border ${paymentType === "transfer" ? "bg-purple-100 border-purple-500 text-purple-700 font-bold" : "bg-white border-gray-200 text-gray-600"}`}
                >
                    🏦 Transferencia
                </button>
                <button
                    type="button"
                    onClick={() => setPaymentType("cash")}
                    className={`text-xs py-2 px-1 rounded border ${paymentType === "cash" ? "bg-green-100 border-green-500 text-green-700 font-bold" : "bg-white border-gray-200 text-gray-600"}`}
                >
                    💵 Efectivo
                </button>
            </div>

            {/* Si elige Transferencia, mostrar selector de Alias */}
            {paymentType === "transfer" && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                    {myPaymentMethods.length > 0 ? (
                        <select
                            value={selectedAliasId}
                            onChange={(e) => setSelectedAliasId(e.target.value)}
                            className="w-full text-sm border border-purple-300 bg-purple-50 rounded px-2 py-2 outline-none focus:ring-1 focus:ring-purple-500"
                        >
                            <option value="">-- Selecciona tu Alias/CBU --</option>
                            {myPaymentMethods.map(m => (
                                <option key={m.id} value={m.id}>{m.platform_name} ({m.alias_cbu})</option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-xs text-red-500">
                            No tienes alias guardados. <a href="/settings" className="underline font-bold">Ir a Configuración</a>
                        </p>
                    )}
                </div>
            )}
            
            {/* Mensajes de ayuda */}
            {paymentType === "mp_link" && <p className="text-[10px] text-gray-500 mt-1">Se generará un link automático (con comisión).</p>}
            {paymentType === "cash" && <p className="text-[10px] text-gray-500 mt-1">Arreglan entre ustedes en persona.</p>}
        </div>

        {/* ... Checkbox de dividir ... */}
        {/* ... Botón Submit ... */}
        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg">
            {loading ? "Creando..." : "Crear Gasto"}
        </button>
      </form>
    </div>
  );
}