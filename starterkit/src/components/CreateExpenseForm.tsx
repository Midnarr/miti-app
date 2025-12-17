"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

// Definimos la estructura de un Amigo
interface Friend {
  id: string;
  friend_email: string;
  friend_name: string;
}

export default function CreateExpenseForm({ 
  currentUserEmail, 
  friends 
}: { 
  currentUserEmail: string; 
  friends: Friend[];
}) {
  const supabase = createClient();
  const router = useRouter();

  // Estados del formulario
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [splitEvenly, setSplitEvenly] = useState(true); // Por defecto divide 50/50
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Función para subir el Ticket (Imagen) a Supabase Storage
  const handleUploadReceipt = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts') // Asegúrate de tener un bucket llamado 'receipts'
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
      // 1. Validaciones
      if (!description || !amount || !selectedFriendId) {
        alert("Por favor completa la descripción, el monto y selecciona un amigo.");
        setLoading(false);
        return;
      }

      // 2. Obtener el usuario actual (para payer_id)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No estás autenticado");

      // 3. Subir ticket si existe
      let receiptUrl = null;
      if (receiptFile) {
        try {
          receiptUrl = await handleUploadReceipt(receiptFile);
        } catch (uploadError) {
          console.error("Error subiendo ticket:", uploadError);
          alert("Hubo un error subiendo la imagen, pero intentaremos crear el gasto.");
        }
      }

      // 4. Calcular montos
      const totalAmount = parseFloat(amount);
      // Si dividimos a la mitad, la deuda es el 50%. Si no (yo invito), la deuda es el total? 
      // Generalmente en 1 a 1:
      // - Si divido a la mitad: Él me debe el 50%
      // - Si NO divido a la mitad (pago yo todo por él): Él me debe el 100%
      const debtAmount = splitEvenly ? (totalAmount / 2) : totalAmount;

      const friendData = friends.find(f => f.id === selectedFriendId);

      // 5. INSERTAR EN BASE DE DATOS
      const { error } = await supabase.from("expenses").insert({
        description: description,
        original_amount: totalAmount,
        amount: debtAmount, // Lo que él me debe
        payer_id: user.id, // Yo pagué
        debtor_email: friendData?.friend_email, // Él me debe
        
        // 👇 ESTA ES LA LÍNEA QUE ARREGLA TU ERROR 👇
        status: "pending", 
        // 👆 Al enviarlo explícitamente, cumplimos la regla de la base de datos
        
        receipt_url: receiptUrl,
        group_id: null // Es un gasto 1 a 1
      });

      if (error) {
        throw error;
      }

      // 6. Limpiar y recargar
      setDescription("");
      setAmount("");
      setReceiptFile(null);
      // setSelectedFriendId(""); // Opcional: limpiar amigo seleccionado
      router.refresh(); // Actualiza el dashboard para ver el nuevo gasto

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

        {/* SUBIDA DE TICKET */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ticket (Opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        {/* OPCIÓN DE DIVIDIR */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
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