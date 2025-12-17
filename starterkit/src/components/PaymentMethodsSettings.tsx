"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

interface PaymentMethod {
  id: string;
  platform_name: string;
  alias_cbu: string;
}

export default function PaymentMethodsSettings({ 
  initialMethods 
}: { 
  initialMethods: PaymentMethod[] 
}) {
  const supabase = createClient();
  const router = useRouter();
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods);
  
  // Form states
  const [platform, setPlatform] = useState("");
  const [alias, setAlias] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform || !alias) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase.from("user_payment_methods").insert({
        user_id: user.id,
        platform_name: platform,
        alias_cbu: alias
      });

      if (!error) {
        setPlatform("");
        setAlias("");
        router.refresh(); // Recarga para traer datos frescos si es server component
        // Hack visual rápido para no esperar al refresh
        // Idealmente usarías optimstic UI, pero esto sirve:
        window.location.reload(); 
      } else {
        alert("Error guardando alias");
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Borrar este método?")) return;
    const { error } = await supabase.from("user_payment_methods").delete().eq("id", id);
    if (!error) {
       setMethods(methods.filter(m => m.id !== id));
       router.refresh();
    }
  };

  return (
    <div className="bg-white p-6 border rounded-xl shadow-sm mt-8">
      <h3 className="font-bold text-lg mb-4 text-gray-800">🏦 Mis Cuentas para Transferencia</h3>
      <p className="text-sm text-gray-500 mb-6">Agrega tus Alias o CBU para que tus amigos puedan transferirte fácilmente.</p>

      {/* LISTA DE MÉTODOS */}
      <div className="space-y-3 mb-8">
        {methods.length === 0 && <p className="text-sm text-gray-400 italic">No tienes cuentas guardadas.</p>}
        {methods.map((m) => (
          <div key={m.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div>
              <p className="font-bold text-sm text-gray-800">{m.platform_name}</p>
              <p className="text-xs text-gray-500 font-mono">{m.alias_cbu}</p>
            </div>
            <button 
              onClick={() => handleDelete(m.id)}
              className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1"
            >
              Borrar
            </button>
          </div>
        ))}
      </div>

      {/* FORMULARIO AGREGAR */}
      <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-bold text-gray-700 mb-3">Agregar Nueva Cuenta</h4>
        <div className="grid grid-cols-1 gap-3">
          <input
            type="text"
            placeholder="Banco / Plataforma (Ej: Naranja X)"
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            className="text-sm w-full border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Alias o CBU"
            value={alias}
            onChange={e => setAlias(e.target.value)}
            className="text-sm w-full border border-gray-300 rounded px-3 py-2"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white text-sm font-bold py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Cuenta"}
          </button>
        </div>
      </form>
    </div>
  );
}