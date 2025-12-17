"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

// Interfaces de datos
interface Friend {
  id: string;
  friend_email: string;
  friend_name: string;
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
  const [splitEvenly, setSplitEvenly] = useState(true); // true = 50/50, false = 100% deuda
  const [loading, setLoading] = useState(false);

  // Estados para Ticket y Cobro
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentType, setPaymentType] = useState<"mp_link" | "transfer" | "cash">("mp_link");
  const [selectedAliasId, setSelectedAliasId] = useState("");

  // Función para subir la imagen a Supabase Storage
  const handleUploadReceipt = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    // Asegúrate de que el bucket 'receipts' exista en tu Supabase Storage y sea público
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
      // 1. Validaciones básicas
      if (!description || !amount || !selectedFriendId) {
        alert("Por favor completa descripción, monto y selecciona un amigo.");
        setLoading(false);
        return;
      }

      // 2. Validar Transferencia (Debe haber elegido un Alias)
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

      // 3. Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No estás autenticado");

      // 4. Subir Ticket (Si existe)
      let receiptUrl = null;
      if (receiptFile) {
        try {
          receiptUrl = await handleUploadReceipt(receiptFile);
        } catch (uploadError) {
          console.error("Error subiendo ticket:", uploadError);
          alert("Hubo un error subiendo la imagen, pero intentaremos crear el gasto.");
        }
      }

      // 5. Cálculos Matemáticos
      const totalAmount = parseFloat(amount);
      const debtAmount = splitEvenly ? (totalAmount / 2) : totalAmount;
      const friendData = friends.find(f => f.id === selectedFriendId);

      // 6. INSERTAR EN SUPABASE
      const { error } = await supabase.from("expenses").insert({
        description: description,
        original_amount: totalAmount,
        amount: debtAmount, // Lo que él me debe
        payer_id: user.id, // Yo pagué
        debtor_email: friendData?.friend_email, // Él me debe
        
        status: "pending", // Importante: Estado inicial
        receipt_url: receiptUrl,
        group_id: null, // Es un gasto 1 a 1

        // Datos de Cobro
        payment_method_type: paymentType, // 'cash', 'transfer', 'mp_link'
        payment_details: finalDetails,    // Ej: "Naranja X: mi.alias"
      });

      if (error) throw error;

      // 7. Limpiar y refrescar
      setDescription("");
      setAmount("");
      setReceiptFile(null);
      setPaymentType("mp_link");
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
                            No tienes alias guardados. <a href="/dashboard/settings" className="underline font-bold">Ir a Configuración</a>
                        </p>
                    )}
                </div>
            )}
            
            {/* Mensajes de ayuda contextual */}
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