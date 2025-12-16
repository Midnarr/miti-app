"use client";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UsernameSetup({ onUsernameSet }: { onUsernameSet: () => void }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const saveUsername = async () => {
    setLoading(true);
    setError("");
    const cleanUsername = username.trim().toLowerCase().replace(/\s/g, "");

    if (cleanUsername.length < 3) {
      setError("Mínimo 3 letras.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Actualizamos el perfil
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: cleanUsername })
      .eq("id", user.id);

    if (updateError) {
      if (updateError.code === "23505") setError("Ese usuario ya existe 😢");
      else setError("Error al guardar.");
    } else {
      router.refresh();
      onUsernameSet(); // Avisamos al padre que ya hay username
    }
    setLoading(false);
  };

  return (
    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 text-center">
      <h3 className="text-lg font-bold text-indigo-900 mb-2">¡Crea tu @Usuario!</h3>
      <p className="text-sm text-indigo-600 mb-4">Para que tus amigos te encuentren.</p>
      
      <div className="flex gap-2 justify-center max-w-sm mx-auto">
        <span className="flex items-center text-gray-500 font-bold text-xl">@</span>
        <input 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="juanperez"
          className="border rounded-lg p-2 w-full lowercase"
        />
        <button 
          onClick={saveUsername}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700"
        >
          {loading ? "..." : "Guardar"}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-2 font-bold">{error}</p>}
    </div>
  );
}