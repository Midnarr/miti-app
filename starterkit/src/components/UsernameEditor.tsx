"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

export default function UsernameEditor({ 
  currentUsername, 
  lastChanged 
}: { 
  currentUsername: string; 
  lastChanged: string | null; 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(currentUsername);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // 1. CALCULAR SI PUEDE EDITAR
  const daysLimit = 60; // 2 meses aprox
  const canEdit = () => {
    if (!lastChanged) return true; // Nunca lo cambió, puede hacerlo
    
    const lastDate = new Date(lastChanged);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    return diffDays >= daysLimit;
  };

  const getNextDate = () => {
    if (!lastChanged) return "";
    const date = new Date(lastChanged);
    date.setDate(date.getDate() + daysLimit);
    return date.toLocaleDateString();
  };

  // 2. GUARDAR
  const handleSave = async () => {
    setLoading(true);
    setError("");
    const cleanUsername = username.trim().toLowerCase().replace(/\s/g, "");

    // Validaciones básicas
    if (cleanUsername.length < 3) {
      setError("Mínimo 3 letras.");
      setLoading(false);
      return;
    }
    if (cleanUsername === currentUsername) {
      setIsEditing(false);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Actualizar en Supabase
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        username: cleanUsername,
        username_last_changed: new Date().toISOString() // 👈 Guardamos la fecha actual
      })
      .eq("id", user.id);

    if (updateError) {
      if (updateError.code === "23505") setError("Ese usuario ya existe 😢");
      else setError("Error al guardar.");
    } else {
      setIsEditing(false);
      router.refresh();
    }
    setLoading(false);
  };

  // VISTA DE LECTURA (Cuando no está editando)
  if (!isEditing) {
    return (
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-gray-800">@{currentUsername}</p>
            
            {/* Solo mostramos el lápiz si puede editar, o mostramos un candado */}
            {canEdit() ? (
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="text-gray-400 hover:text-indigo-600 transition-colors text-sm"
                    title="Editar nombre de usuario"
                >
                    ✏️
                </button>
            ) : (
                <span className="text-xs cursor-help text-gray-300" title={`Podrás cambiarlo el ${getNextDate()}`}>🔒</span>
            )}
        </div>
        {!canEdit() && (
            <p className="text-[10px] text-gray-400 mt-1">
                Podrás cambiarlo nuevamente el {getNextDate()}
            </p>
        )}
      </div>
    );
  }

  // VISTA DE EDICIÓN
  return (
    <div className="flex flex-col gap-2 w-full max-w-[200px]">
      <div className="flex gap-1">
        <input 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border rounded px-2 py-1 text-sm w-full outline-indigo-500"
          placeholder="nuevo usuario"
          autoFocus
        />
        <button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-bold"
        >
            {loading ? "..." : "OK"}
        </button>
        <button 
            onClick={() => {
                setIsEditing(false);
                setError("");
                setUsername(currentUsername);
            }} 
            className="text-gray-400 px-1 text-xs"
        >
            X
        </button>
      </div>
      {error && <p className="text-red-500 text-[10px] font-bold text-left">{error}</p>}
    </div>
  );
}