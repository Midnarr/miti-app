"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

export default function FriendsManager({ friends }: { friends: any[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);

  const addFriend = async (formData: FormData) => {
    setLoading(true);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from("friends").insert({
        user_id: user.id,
        friend_email: email.toLowerCase().trim(),
        friend_name: name
      });
      
      formRef.current?.reset();
      router.refresh();
    }
    setLoading(false);
  };

  const deleteFriend = async (id: string) => {
    if(!confirm("¿Borrar amigo?")) return;
    const supabase = createClient();
    await supabase.from("friends").delete().eq("id", id);
    router.refresh();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 h-fit">
      <h3 className="font-bold text-gray-800 mb-4">📒 Tu Agenda de Amigos</h3>

      {/* Formulario Agregar */}
      <form ref={formRef} action={addFriend} className="flex gap-2 mb-6">
        <input 
          name="name" 
          placeholder="Nombre (Ej: Juan)" 
          required 
          className="w-1/3 border rounded-lg px-3 py-2 text-sm"
        />
        <input 
          name="email" 
          type="email" 
          placeholder="Email" 
          required 
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button 
          disabled={loading}
          className="bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold text-xl hover:bg-indigo-700"
        >
          {loading ? "..." : "+"}
        </button>
      </form>

      {/* Lista */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {friends.length === 0 ? (
          <p className="text-gray-400 text-sm text-center italic">No tienes amigos guardados.</p>
        ) : (
          friends.map((f) => (
            <div key={f.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
              <div>
                <p className="font-bold text-sm text-gray-800">{f.friend_name}</p>
                <p className="text-xs text-gray-500">{f.friend_email}</p>
              </div>
              <button 
                onClick={() => deleteFriend(f.id)}
                className="text-gray-400 hover:text-red-500 font-bold px-2"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}