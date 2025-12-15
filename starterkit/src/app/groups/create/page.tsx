"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function CreateGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    const name = formData.get("name") as string;
    const emailsInput = formData.get("emails") as string;
    
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
          throw new Error(`Los siguientes usuarios no están registrados: ${missingEmails.join(", ")}. Invítalos a Miti primero.`);
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
      const membersToInsert = allMembers.map(email => ({
        group_id: group.id,
        member_email: email
      }));

      const { error: membersError } = await supabase
        .from("group_members")
        .insert(membersToInsert);

      if (membersError) throw membersError;

      router.refresh();
      router.push(`/dashboard/groups/${group.id}`);

    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Crear Nuevo Grupo</h1>
        <p className="text-sm text-gray-500 mb-6">Comparte gastos de viajes, casa o salidas.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
            🚨 {error}
          </div>
        )}

        <form action={createGroup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Grupo</label>
            <input
              name="name"
              type="text"
              required
              placeholder="Ej: Viaje al Sur 🏔️"
              className="w-full rounded-lg border-gray-300 py-2.5 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invitar Miembros <span className="text-gray-400 font-normal">(Emails registrados)</span>
            </label>
            <textarea
              name="emails"
              rows={3}
              placeholder="juan@gmail.com, maria@hotmail.com"
              className="w-full rounded-lg border-gray-300 py-2.5 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separa los emails con comas. Deben tener cuenta en Miti.
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <Link 
              href="/dashboard/groups"
              className="flex-1 text-center py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Crear Grupo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}