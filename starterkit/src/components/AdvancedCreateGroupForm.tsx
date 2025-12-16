"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

// Recibimos la lista de amigos
export default function AdvancedCreateGroupForm({ friends }: { friends: any[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    const name = formData.get("name") as string;
    
    // Obtenemos los emails seleccionados de los checkboxes
    const selectedEmails = formData.getAll("friend_emails") as string[];
    
    // También permitimos escribir emails manuales si hace falta
    const manualEmailsInput = formData.get("manual_emails") as string;
    const manualEmails = manualEmailsInput
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);

    // Unimos todo sin duplicados
    const finalEmails = Array.from(new Set([...selectedEmails, ...manualEmails]));

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
      if (finalEmails.length === 0) throw new Error("Invita al menos a 1 persona.");

      // 1. Crear el Grupo
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({ name, created_by: user.id })
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Añadir miembros
      const allMembers = [...finalEmails, user.email];
      
      const membersToInsert = allMembers.map(email => ({
        group_id: group.id,
        member_email: email
      }));

      const { error: membersError } = await supabase
        .from("group_members")
        .insert(membersToInsert);

      if (membersError) throw membersError;

      formRef.current?.reset();
      router.refresh(); 
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-indigo-100 h-fit">
      <h2 className="font-bold text-xl text-gray-800 mb-2">🚀 Nuevo Grupo</h2>
      <p className="text-sm text-gray-500 mb-6">Selecciona amigos para invitarlos.</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
          🚨 {error}
        </div>
      )}

      <form ref={formRef} action={createGroup} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Grupo</label>
          <input name="name" type="text" required placeholder="Ej: Viaje al Sur" className="w-full rounded-lg border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Invitar Amigos
          </label>
          
          {friends.length === 0 ? (
             <p className="text-xs text-gray-400 italic mb-2">No tienes amigos guardados aún.</p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-2 border rounded-lg p-2 bg-gray-50 mb-2">
              {friends.map((f) => (
                <label key={f.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                  <input type="checkbox" name="friend_emails" value={f.friend_email} className="text-indigo-600 rounded focus:ring-indigo-500" />
                  <div className="text-sm">
                    <span className="font-bold text-gray-700">{f.friend_name}</span>
                    <span className="text-xs text-gray-400 ml-1">({f.friend_email})</span>
                  </div>
                </label>
              ))}
            </div>
          )}

          <input name="manual_emails" placeholder="Otros emails (separar con comas)" className="w-full rounded-lg border-gray-300 py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-500 mt-2" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm">
          {loading ? "Creando..." : "Crear Grupo"}
        </button>
      </form>
    </div>
  );
}