"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Member = {
  email: string;
  username: string;
  id: string; // ID del perfil
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

    // Borramos de la tabla group_members
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
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {members.map((member) => (
          <div 
            key={member.email} 
            className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600 text-xs">
                {member.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800">
                  @{member.username}
                  {member.id === creatorId && <span className="ml-1 text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded border border-yellow-200">👑 Admin</span>}
                </p>
                <p className="text-[10px] text-gray-400">{member.email}</p>
              </div>
            </div>

            {/* BOTÓN ELIMINAR (Solo visible para el Creador y NO puede borrarse a sí mismo) */}
            {isCreator && member.id !== creatorId && (
              <button
                onClick={() => removeMember(member.email)}
                disabled={loading === member.email}
                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                title="Expulsar del grupo"
              >
                {loading === member.email ? "..." : "🗑️"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}