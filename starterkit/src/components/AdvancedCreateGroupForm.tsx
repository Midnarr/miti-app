"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

export default function AdvancedCreateGroupForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    const name = formData.get("name") as string;
    const emailsInput = formData.get("emails") as string;
    
    // Limpieza de emails
    const emails = emailsInput
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    try {
      // 1. VALIDACIÓN: VERIFICAR QUE TODOS LOS EMAILS EXISTEN
      if (emails.length > 0) {
        const { data: foundProfiles, error: searchError } = await supabase
          .from("profiles")
          .select("email")
          .in("email", emails);

        if (searchError) throw searchError;

        const foundEmails = foundProfiles?.map(p => p.email) || [];
        const missingEmails = emails.filter(e => !foundEmails.includes(e));

        if (missingEmails.length > 0) {
          throw new Error(`Usuarios no registrados: ${missingEmails.join(", ")}. Invítalos a Miti primero.`);
        }
      }

      // 2. Crear el Grupo
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({ name, created_by: user.id })
        .select()
        .single();

      if (groupError) throw groupError;

      // 3. Añadir miembros
      const allMembers = [...emails, user.email];
      // ...
      const membersToInsert = allMembers.map(email => ({
        group_id: group.id,
        member_email: email,
      }));
      // .

      const { error: membersError } = await supabase
        .from("group_members")
        .insert(membersToInsert);

      if (membersError) throw membersError;

      // Limpiar formulario y refrescar lista
      formRef.current?.reset();
      router.refresh(); 
      // Opcional: Si quieres redirigir adentro del grupo, descomenta esto:
      // router.push(`/dashboard/groups/${group.id}`);
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-indigo-100 h-fit">
      <h2 className="font-bold text-xl text-gray-800 mb-2">🚀 Nuevo Grupo</h2>
      <p className="text-sm text-gray-500 mb-6">Crea un grupo e invita amigos al instante.</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
          🚨 {error}
        </div>
      )}

      <form ref={formRef} action={createGroup} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
          <input
            name="name"
            type="text"
            required
            placeholder="Ej: Viaje al Sur 🏔️"
            className="w-full rounded-lg border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Invitar (Emails)
          </label>
          <textarea
            name="emails"
            rows={2}
            placeholder="juan@gmail.com, maria@hotmail.com"
            className="w-full rounded-lg border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Separa con comas. Deben tener cuenta en Miti.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 text-sm"
        >
          {loading ? "Verificando..." : "Crear Grupo"}
        </button>
      </form>
    </div>
  );
}