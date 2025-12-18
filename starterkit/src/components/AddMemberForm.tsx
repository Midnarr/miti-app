"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inviteUserToApp } from "@/app/actions/invite";

export default function AddMemberForm({ 
  groupId, 
  friends, 
  existingEmails 
}: { 
  groupId: string; 
  friends: any[]; 
  existingEmails: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Estado para el input manual de email
  const [manualEmail, setManualEmail] = useState("");

  // Filtramos amigos que NO estén ya en el grupo
  const availableFriends = friends.filter(f => !existingEmails.includes(f.friend_email));

  // Función principal para agregar (usada tanto por botones de amigos como por input manual)
  const handleAddMember = async (email: string) => {
    if (!email || !email.includes("@")) {
      alert("Por favor ingresa un email válido.");
      return;
    }

    if (existingEmails.includes(email)) {
      alert("Esta persona ya está en el grupo.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    
    try {
      // 1. Insertamos en la base de datos (group_members)
      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        member_email: email.toLowerCase().trim()
      });

      if (error) throw error;

      // 2. Intentamos enviar invitación por email (Server Action)
      // Esto verificará si el usuario existe o no en Auth
      const inviteRes = await inviteUserToApp(email);

      if (inviteRes.success && inviteRes.message === "Invitación enviada") {
        alert(`✅ Agregado! Se envió un correo de invitación a ${email}`);
      } else if (inviteRes.success) {
        // Usuario ya existía
        // No mostramos alerta para no interrumpir, o un toast sutil
        console.log("Usuario agregado (ya estaba registrado).");
      } else {
        console.error("Error enviando invitación:", inviteRes.message);
      }

      // 3. Limpieza
      setManualEmail("");
      router.refresh();
      // Opcional: Cerrar el modal o dejarlo abierto para agregar más
      // setIsOpen(false); 

    } catch (error: any) {
      alert("Error al agregar miembro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 border border-indigo-100"
        >
          <span>👤+</span> Añadir miembro al grupo
        </button>
      ) : (
        <div className="bg-gray-50 p-4 rounded-xl border border-indigo-100 animate-fade-in space-y-4">
          
          {/* CABECERA */}
          <div className="flex justify-between items-center">
             <h4 className="font-bold text-gray-700 text-sm">Añadir Integrantes</h4>
             <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-red-500">✕</button>
          </div>

          {/* OPCIÓN 1: Escribir Email Manualmente */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email nuevo</label>
            <div className="flex gap-2">
              <input 
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="ejemplo@gmail.com"
                className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddMember(manualEmail);
                }}
              />
              <button 
                onClick={() => handleAddMember(manualEmail)}
                disabled={loading || !manualEmail}
                className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "..." : "Agregar"}
              </button>
            </div>
          </div>
          
          <hr className="border-gray-200" />

          {/* OPCIÓN 2: Seleccionar Amigos */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">O elige de tus amigos:</label>
            {availableFriends.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No tienes amigos disponibles para agregar.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableFriends.map((f) => (
                  <button
                    key={f.id}
                    disabled={loading}
                    onClick={() => handleAddMember(f.friend_email)}
                    className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold px-3 py-2 rounded-full hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-1"
                  >
                    <span>+</span> {f.friend_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}