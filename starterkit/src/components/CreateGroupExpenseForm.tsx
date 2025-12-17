"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image"; // 👈 Importamos Image para los avatares

interface Member {
  id: string;
  name: string; 
  avatar_url?: string | null;
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
  
  // 👇 NUEVO: Estado para saber quiénes participan en el gasto
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Al cargar el componente, marcamos a TODOS por defecto
  useEffect(() => {
    if (members.length > 0) {
        setSelectedMemberIds(members.map(m => m.id));
    }
  }, [members]);

  // Función para marcar/desmarcar
  const toggleMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
        // Si ya está, lo sacamos (desmarcar)
        setSelectedMemberIds(prev => prev.filter(id => id !== memberId));
    } else {
        // Si no está, lo agregamos (marcar)
        setSelectedMemberIds(prev => [...prev, memberId]);
    }
  };

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentType, setPaymentType] = useState<"mp_link" | "transfer" | "cash">("mp_link");
  const [selectedAliasId, setSelectedAliasId] = useState("");

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

      // Validar que haya al menos alguien seleccionado
      if (selectedMemberIds.length === 0) {
        alert("Debes seleccionar al menos a una persona para dividir el gasto.");
        setLoading(false);
        return;
      }

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
      
      // 👇 LÓGICA DE DIVISIÓN ACTUALIZADA
      // Dividimos el monto total SOLO entre la cantidad de gente seleccionada
      const splitAmount = totalAmount / selectedMemberIds.length; 

      const expensesToInsert = members
        // 1. Filtramos solo los miembros que fueron seleccionados
        .filter(member => selectedMemberIds.includes(member.id))
        // 2. Excluimos al pagador (yo no me debo a mí mismo)
        .filter(member => member.id !== user.id) 
        .map(member => ({
          description: description,
          original_amount: totalAmount,
          amount: splitAmount, // Cuota ajustada a la cantidad de participantes
          payer_id: user.id,  
          debtor_email: member.name, 
          group_id: groupId,
          status: "pending",
          receipt_url: receiptUrl, 
          payment_method_type: paymentType,
          payment_details: finalDetails
        }));
      
      if (expensesToInsert.length > 0) {
        const { error } = await supabase.from("expenses").insert(expensesToInsert);
        if (error) throw error;
      }

      setDescription("");
      setAmount("");
      setReceiptFile(null);
      setPaymentType("mp_link");
      
      // Reseteamos la selección a "Todos" para el próximo gasto
      setSelectedMemberIds(members.map(m => m.id));
      
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

        {/* 👇 NUEVO SECTOR: SELECCIÓN DE MIEMBROS */}
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase">Dividir entre:</label>
                <button 
                    type="button"
                    onClick={() => setSelectedMemberIds(members.map(m => m.id))}
                    className="text-[10px] text-indigo-600 font-bold hover:underline"
                >
                    Seleccionar Todos
                </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {members.map(member => {
                    const isSelected = selectedMemberIds.includes(member.id);
                    return (
                        <div 
                            key={member.id}
                            onClick={() => toggleMember(member.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all select-none ${
                                isSelected
                                ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500" 
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            {/* Checkbox Visual */}
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                            }`}>
                                {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            
                            {/* Avatar y Nombre */}
                            <div className="flex items-center gap-2 overflow-hidden w-full">
                                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-100">
                                    {member.avatar_url ? (
                                        <Image src={member.avatar_url} alt={member.name} fill className="object-cover" />
                                    ) : (
                                        <span className="flex items-center justify-center w-full h-full text-[10px] font-bold text-gray-500">
                                            {member.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-xs truncate ${isSelected ? "font-bold text-indigo-900" : "font-medium text-gray-600"}`}>
                                    {member.name}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Info de división dinámica */}
            {amount && selectedMemberIds.length > 0 && (
                <p className="text-right text-[10px] text-gray-400 mt-1">
                    ${(parseFloat(amount) / selectedMemberIds.length).toFixed(2)} por persona
                </p>
            )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ticket / Recibo (Opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

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
          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          {loading ? "Dividiendo..." : "Dividir Gasto"}
        </button>
      </form>
    </div>
  );
}