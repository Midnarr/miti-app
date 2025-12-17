"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image"; // 👈 IMPORTANTE: Para mostrar la foto

// Interfaces de datos
interface Friend {
  id: string;
  friend_email: string;
  friend_name: string;
  avatar_url?: string | null; // 👈 NUEVO: Agregamos la foto (opcional)
}

interface PaymentMethod {
  id: string;
  platform_name: string;
  alias_cbu: string;
}

export default function CreateExpenseForm({ 
  currentUserEmail, 
  friends,
  myPaymentMethods
}: { 
  currentUserEmail: string; 
  friends: Friend[];
  myPaymentMethods: PaymentMethod[];
}) {
  const supabase = createClient();
  const router = useRouter();

  // Estados del Formulario
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [splitEvenly, setSplitEvenly] = useState(true); 
  const [loading, setLoading] = useState(false);

  // Estados para Ticket y Cobro
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentType, setPaymentType] = useState<"mp_link" | "transfer" | "cash">("mp_link");
  const [selectedAliasId, setSelectedAliasId] = useState("");

  // 👇 LÓGICA NUEVA: Encontrar al amigo seleccionado para mostrar su foto
  const selectedFriend = friends.find(f => f.id === selectedFriendId);

  // Función para subir la imagen a Supabase Storage
  const handleUploadReceipt = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!description || !amount || !selectedFriendId) {
        alert("Por favor completa descripción, monto y selecciona un amigo.");
        setLoading(false);
        return;
      }

      let finalDetails = null;
      if (paymentType === "transfer") {
        if (!selectedAliasId) {
          alert("Si eliges Transferencia, debes seleccionar a qué cuenta quieres que te envíen.");
          setLoading(false);
          return;
        }
        const method = myPaymentMethods.find(m => m.id === selectedAliasId);
        finalDetails = `${method?.platform_name}: ${method?.alias_cbu}`;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No estás autenticado");

      let receiptUrl = null;
      if (receiptFile) {
        try {
          receiptUrl = await handleUploadReceipt(receiptFile);
        } catch (uploadError) {
          console.error("Error subiendo ticket:", uploadError);
          alert("Hubo un error subiendo la imagen, pero intentaremos crear el gasto.");
        }
      }

      const totalAmount = parseFloat(amount);
      const debtAmount = splitEvenly ? (totalAmount / 2) : totalAmount;
      const friendData = friends.find(f => f.id === selectedFriendId);

      const { error } = await supabase.from("expenses").insert({
        description: description,
        original_amount: totalAmount,
        amount: debtAmount, 
        payer_id: user.id, 
        debtor_email: friendData?.friend_email, 
        status: "pending", 
        receipt_url: receiptUrl,
        group_id: null, 
        payment_method_type: paymentType, 
        payment_details: finalDetails,    
      });

      if (error) throw error;

      setDescription("");
      setAmount("");
      setReceiptFile(null);
      setPaymentType("mp_link");
      // No reseteamos el amigo seleccionado para que sea más rápido cargar otro gasto
      router.refresh(); 

    } catch (error: any) {
      console.error(error);
      alert("Error al crear gasto: " + (error.message || error.details));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">✨</span>
        <h2 className="text-lg font-bold text-gray-800">Nuevo Gasto (1 a 1)</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* DESCRIPCIÓN */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cena, Uber..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* MONTO */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          {/* SELECTOR DE AMIGO */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amigo</label>
            <select
              value={selectedFriendId}
              onChange={(e) => setSelectedFriendId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="">Seleccionar...</option>
              {friends.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.friend_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 👇 NUEVO: PREVISUALIZACIÓN DEL AMIGO SELECCIONADO */}
        {selectedFriend && (
            <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100 animate-in fade-in duration-300">
                <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                    {selectedFriend.avatar_url ? (
                        <Image 
                            src={selectedFriend.avatar_url} 
                            alt={selectedFriend.friend_name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {selectedFriend.friend_name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-800 truncate">{selectedFriend.friend_name}</p>
                    <p className="text-xs text-gray-500 truncate">{selectedFriend.friend_email}</p>
                </div>
            </div>
        )}

        {/* INPUT DE TICKET / FOTO */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ticket (Opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        {/* SELECTOR DE MÉTODO DE COBRO */}
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">¿Cómo quieres cobrar esto?</label>
            
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
                            <option value="">-- Selecciona tu Alias/CBU --</option>
                            {myPaymentMethods.map(m => (
                                <option key={m.id} value={m.id}>{m.platform_name} ({m.alias_cbu})</option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-xs text-red-500">
                            No tienes alias guardados. <a href="/dashboard/settings" className="underline font-bold">Ir a Configuración</a>
                        </p>
                    )}
                </div>
            )}
            
            {paymentType === "mp_link" && <p className="text-[10px] text-gray-500 mt-1">Se generará un link automático (con comisión).</p>}
            {paymentType === "cash" && <p className="text-[10px] text-gray-500 mt-1">Arreglan entre ustedes en persona.</p>}
        </div>

        {/* OPCIÓN DE DIVIDIR */}
        <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
          <input
            type="checkbox"
            id="split"
            checked={splitEvenly}
            onChange={(e) => setSplitEvenly(e.target.checked)}
            className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          />
          <label htmlFor="split" className="text-sm text-gray-600 cursor-pointer select-none">
            <span className="font-semibold text-gray-800">Dividir a la mitad</span>
            <p className="text-xs text-gray-500 mt-0.5">
              {amount && splitEvenly 
                ? `Tú pagas 50%, él debe 50% ($${(parseFloat(amount)/2).toFixed(2)})`
                : "Tú pagas todo, él te debe el 100%"}
            </p>
          </label>
        </div>

        {/* BOTÓN DE CREAR */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#4F46E5] hover:bg-[#4338ca] text-white font-bold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creando..." : "Crear Gasto"}
        </button>
      </form>
    </div>
  );
}