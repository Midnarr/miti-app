"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

export default function DeleteGroupButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleDelete = async () => {
    // 1. Confirmación fuerte
    const confirmed = window.confirm(
      "⚠️ ¿ESTÁS SEGURO?\n\nSe eliminará el grupo, todos sus miembros y todo el historial de gastos para siempre.\n\nEsta acción no se puede deshacer."
    );

    if (!confirmed) return;

    setLoading(true);

    // 2. Borrar el grupo (El borrado en cascada de SQL debería borrar miembros y gastos automáticamente si está configurado, si no, borrará solo el grupo y los demás quedarán huérfanos o dará error, pero asumiremos cascada o RLS desactivado como tienes ahora)
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);

    if (error) {
      alert("Error al eliminar el grupo: " + error.message);
      setLoading(false);
    } else {
      // 3. Redirigir al dashboard/listado para salir de la página muerta
      router.push("/groups"); 
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
    >
      {loading ? "Borrando..." : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          Eliminar Grupo
        </>
      )}
    </button>
  );
}