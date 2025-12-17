"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  name: string; // Puede ser username o email
}

interface PaymentMethod {
  id: string;
  platform_name: string;
  alias_cbu: string;
}

export default function CreateGroupExpenseForm({
  groupId,
  members,
  myPaymentMethods
}: {
  groupId: string;
  members: Member[];
  myPaymentMethods: PaymentMethod[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 👇 ESTADOS PARA TICKET Y MÉTODO DE COBRO
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentType, setPaymentType] = useState<"mp_link" | "transfer" | "cash">("mp_link");
  const [selectedAliasId, setSelectedAliasId] = useState("");

  // Función de subida de imagen (reutilizable)
  const handleUploadReceipt = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!description || !amount) {
        alert("Completa descripción y monto.");
        setLoading(false);
        return;
      }

      // Validar Transferencia
      let finalDetails = null;
      if (paymentType === "transfer") {
        if (!selectedAliasId) {
          alert("Selecciona a qué Alias/CBU quieres que te paguen.");
          setLoading(false);
          return;
        }
        const method = myPaymentMethods.find(m => m.id === selectedAliasId);
        finalDetails = `${method?.platform_name}: ${method?.alias_cbu}`;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // 1. Subir Ticket si existe
      let receiptUrl = null;
      if (receiptFile) {
        try {
          receiptUrl = await handleUploadReceipt(receiptFile);
        } catch (error) {
          console.error("Error subiendo imagen:", error);
          alert("Error subiendo el ticket, pero se creará el gasto.");
        }
      }

      const totalAmount = parseFloat(amount);
      const splitAmount = totalAmount / members.length; // División simple entre todos

      // 2. Crear los gastos para cada miembro (menos para mí mismo)
      const expensesToInsert = members
        .filter(member => member.id !== user.id) // No me cobro a mí mismo
        .map(member => ({
          description: description,
          original_amount: totalAmount,
          amount: splitAmount, // Lo que debe cada uno
          payer_id: user.id,   // Yo pagué
          debtor_email: member.name, // Usamos el nombre/email como identificador temporal o ID si lo tienes mapeado
          // NOTA: Idealmente 'debtor_email' debería ser el email real. 
          // Si 'member.name' no es email, asegúrate de pasar el email en la prop 'members'.
          
          group_id: groupId,
          status: "pending",
          receipt_url: receiptUrl, // 👈 Aquí va el recibo

          // 👇 DATOS DE COBRO
          payment_method_type: paymentType,
          payment_details: finalDetails
        }));
      
      // Si el array está vacío (soy el único en el grupo), no hacemos nada
      if (expensesToInsert.length > 0) {
        const { error } = await supabase.from("expenses").insert(expensesToInsert);
        if (error) throw error;
      }

      setDescription("");
      setAmount("");
      setReceiptFile(null);
      setPaymentType("mp_link");
      router.refresh();

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <h2 className="text-lg font-bold text-gray-800 mb-4">✨ Nuevo Gasto Grupal</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cena, Supermercado..."
            className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto Total ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* 👇 RECUPERADO: INPUT DE ARCHIVO (TICKET) */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ticket / Recibo (Opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        {/* 👇 SELECTOR DE MÉTODO DE COBRO */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">¿Cómo quieres que te devuelvan?</label>
            
            <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                    type="button"
                    onClick={() => setPaymentType("mp_link")}
                    className={`text-xs py-2 px-1 rounded border ${paymentType === "mp_link" ? "bg-blue-100 border-blue-500 text-blue-700 font-bold" : "bg-white border-gray-200 text-gray-600"}`}
                >
                    📲 Mercado Pago
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

            {paymentType === "transfer" && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                    {myPaymentMethods.length > 0 ? (
                        <select
                            value={selectedAliasId}
                            onChange={(e) => setSelectedAliasId(e.target.value)}
                            className="w-full text-sm border border-purple-300 bg-purple-50 rounded px-2 py-2 outline-none focus:ring-1 focus:ring-purple-500"
                        >
                            <option value="">-- Elige tu Alias --</option>
                            {myPaymentMethods.map(m => (
                                <option key={m.id} value={m.id}>{m.platform_name} ({m.alias_cbu})</option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-xs text-red-500">No tienes alias guardados en Configuración.</p>
                    )}
                </div>
            )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {loading ? "Dividiendo..." : "Dividir Gasto"}
        </button>
      </form>
    </div>
  );
}