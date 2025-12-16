"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

  // Filtramos amigos que NO estén ya en el grupo
  const availableFriends = friends.filter(f => !existingEmails.includes(f.friend_email));

  const addFriendToGroup = async (email: string) => {
    setLoading(true);
    const supabase = createClient();
    
    // Insertamos en group_members
    const { error } = await supabase.from("group_members").insert({
      group_id: groupId,
      member_email: email
    });

    if (error) {
      alert("Error al agregar miembro");
    } else {
      router.refresh();
      setIsOpen(false);
    }
    setLoading(false);
  };

  return (
    <div className="mb-6">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 border border-indigo-100"
        >
          <span>👤+</span> Añadir otro amigo al grupo
        </button>
      ) : (
        <div className="bg-gray-50 p-4 rounded-xl border border-indigo-100 animate-fade-in">
          <div className="flex justify-between items-center mb-3">
             <h4 className="font-bold text-gray-700 text-sm">Selecciona un amigo:</h4>
             <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-red-500">✕</button>
          </div>
          
          {availableFriends.length === 0 ? (
            <p className="text-xs text-gray-400 italic">
              Ya agregaste a todos tus amigos (o no tienes amigos nuevos).
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableFriends.map((f) => (
                <button
                  key={f.id}
                  disabled={loading}
                  onClick={() => addFriendToGroup(f.friend_email)}
                  className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold px-3 py-2 rounded-full hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  {loading ? "..." : `+ ${f.friend_name}`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}