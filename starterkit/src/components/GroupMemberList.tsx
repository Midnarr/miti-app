"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image"; // 👈 Importamos el componente de imagen

// 👇 Actualizamos el tipo para incluir avatar_url
type Member = {
  email: string;
  username: string;
  id: string; 
  avatar_url?: string | null; // Campo opcional
};

export default function GroupMemberList({
  groupId,
  members,
  currentUserId,
  creatorId,
}: {
  groupId: string;
  members: Member[];
  currentUserId: string;
  creatorId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const isCreator = currentUserId === creatorId;

  const removeMember = async (email: string) => {
    if (!confirm(`¿Seguro que quieres eliminar a ${email} del grupo?`)) return;
    
    setLoading(email);
    const supabase = createClient();

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("member_email", email);

    if (error) {
      alert("Error al eliminar miembro.");
      console.error(error);
    } else {
      router.refresh();
    }
    setLoading(null);
  };

  return (
    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
      <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
        Miembros del Grupo ({members.length})
      </h3>
      
      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {members.map((member) => (
          <div 
            key={member.email} 
            className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              
              {/* 👇 ÁREA DEL AVATAR */}
              <div className="relative h-8 w-8 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 border border-indigo-200">
                  {member.avatar_url ? (
                      <Image 
                        src={member.avatar_url} 
                        alt={member.username} 
                        fill 
                        className="object-cover" 
                      />
                  ) : (
                      <div className="h-full w-full flex items-center justify-center font-bold text-indigo-600 text-xs">
                        {/* Fallback a la inicial si no hay foto */}
                        {(member.username || member.email).charAt(0).toUpperCase()}
                      </div>
                  )}
              </div>

              <div className="overflow-hidden">
                <p className="font-bold text-sm text-gray-800 truncate max-w-[150px]">
                  @{member.username}
                  {member.id === creatorId && <span className="ml-1 text-[9px] bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded border border-yellow-200 align-middle">👑</span>}
                  {member.id === currentUserId && <span className="ml-1 text-[9px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded border border-gray-200 align-middle">Tú</span>}
                </p>
                <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{member.email}</p>
              </div>
            </div>

            {/* BOTÓN ELIMINAR */}
            {isCreator && member.id !== creatorId && (
              <button
                onClick={() => removeMember(member.email)}
                disabled={loading === member.email}
                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all"
                title="Expulsar del grupo"
              >
                {loading === member.email ? (
                   <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                     <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                   </svg>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}