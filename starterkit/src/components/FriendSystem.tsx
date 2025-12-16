"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

export default function FriendSystem({ currentUserId }: { currentUserId: string }) {
  const supabase = createClient();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]); 
  const [friends, setFriends] = useState<any[]>([]);   
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null); // Para saber cuál se está borrando

  // Definimos la función de carga
  const fetchFriendsAndRequests = useCallback(async () => {
    try {
      // 1. SOLICITUDES PENDIENTES
      const { data: rawRequests } = await supabase
        .from("friends")
        .select("*")
        .eq("receiver_id", currentUserId)
        .eq("status", "pending");

      let formattedRequests: any[] = [];
      if (rawRequests && rawRequests.length > 0) {
        const senderIds = rawRequests.map(r => r.requester_id);
        const { data: profiles } = await supabase.from("profiles").select("id, username, email").in("id", senderIds);

        formattedRequests = rawRequests.map(req => {
          const profile = profiles?.find(p => p.id === req.requester_id);
          return { ...req, requester: profile || { username: "Desconocido" } };
        });
      }
      setRequests(formattedRequests);

      // 2. AMIGOS ACEPTADOS (LÓGICA MEJORADA PARA OBTENER ID DE AMISTAD)
      const { data: rawFriends } = await supabase
        .from("friends")
        .select("*")
        .eq("status", "accepted")
        .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

      let formattedFriends: any[] = [];

      if (rawFriends && rawFriends.length > 0) {
        // Sacamos IDs de los usuarios amigos
        const friendUserIds = rawFriends.map(f => 
            f.requester_id === currentUserId ? f.receiver_id : f.requester_id
        );
        
        // Buscamos sus perfiles
        const { data: friendProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", friendUserIds);
          
        // COMBINAMOS: Perfil + ID de la Amistad (Importante para borrar)
        formattedFriends = rawFriends.map(friendship => {
            const otherUserId = friendship.requester_id === currentUserId ? friendship.receiver_id : friendship.requester_id;
            const profile = friendProfiles?.find(p => p.id === otherUserId);
            
            return {
                ...profile,              // Datos del usuario (username, email)
                friendship_id: friendship.id // ID de la relación (para borrar)
            };
        });
      }
      setFriends(formattedFriends);

    } catch (error) {
      console.error("Error general:", error);
    }
  }, [currentUserId, supabase]);

  useEffect(() => {
    fetchFriendsAndRequests();
  }, [fetchFriendsAndRequests]);


  // --- FUNCIONES DE ACCIÓN ---

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id, username, email")
      .ilike("username", `%${term}%`)
      .neq("id", currentUserId)
      .limit(5);
    setSearchResults(data || []);
  };

  const sendRequest = async (receiverId: string) => {
    setLoading(true);
    // Verificamos si ya existe relación
    const { data: existing } = await supabase.from("friends").select("*")
      .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${currentUserId})`)
      .single();

    if (existing) {
      alert(existing.status === 'accepted' ? "¡Ya son amigos!" : "Ya hay una solicitud pendiente.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("friends").insert({ requester_id: currentUserId, receiver_id: receiverId, status: "pending" });

    if (error) alert("Error al enviar solicitud.");
    else {
      alert("¡Solicitud enviada! 🚀");
      setSearchTerm("");
      setSearchResults([]);
      fetchFriendsAndRequests();
    }
    setLoading(false);
  };

  const acceptRequest = async (friendshipId: string) => {
    await supabase.from("friends").update({ status: "accepted" }).eq("id", friendshipId);
    fetchFriendsAndRequests();
    router.refresh();
  };

  // 👇 NUEVA FUNCIÓN: BORRAR AMIGO
  const removeFriend = async (friendshipId: string, friendName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a @${friendName} de tus amigos?`)) return;

    setDeleteLoading(friendshipId);
    
    const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendshipId); // Borramos usando el ID de la relación

    if (error) {
        console.error(error);
        alert("Error al eliminar.");
    } else {
        fetchFriendsAndRequests(); // Recargar lista
        router.refresh();
    }
    setDeleteLoading(null);
  };

  return (
    <div className="space-y-8">
      
      {/* 1. BUSCADOR */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
        <h3 className="font-bold text-gray-800 mb-2">🔍 Buscar Amigos</h3>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-gray-400 font-bold">@</span>
          <input
            type="text"
            placeholder="Escribe un username..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 border rounded-lg overflow-hidden bg-gray-50 max-h-40 overflow-y-auto">
            {searchResults.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-3 hover:bg-indigo-50 transition-colors">
                <p className="font-bold text-gray-800">@{user.username}</p>
                <button
                  onClick={() => sendRequest(user.id)}
                  disabled={loading}
                  className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-full font-bold hover:bg-indigo-700"
                >
                  Agregar +
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. SOLICITUDES */}
      {requests.length > 0 && (
        <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
          <h3 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
            🔔 Solicitudes <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{requests.length}</span>
          </h3>
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center border border-orange-100">
                <div>
                   <p className="font-bold text-gray-800">@{req.requester?.username}</p>
                   <p className="text-xs text-gray-500">Quiere conectar contigo</p>
                </div>
                <button onClick={() => acceptRequest(req.id)} className="bg-green-500 text-white text-xs px-4 py-2 rounded-full font-bold hover:bg-green-600">
                  ✓ Aceptar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. LISTA DE AMIGOS (CON BOTÓN DE BORRAR) */}
      <div>
        <h3 className="font-bold text-gray-800 mb-4 text-xl">Mis Amigos ({friends.length})</h3>
        {friends.length === 0 ? (
          <p className="text-gray-400 italic text-sm">Aún no tienes amigos.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((friend) => (
              <div key={friend.friendship_id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                
                {/* Info Amigo */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">
                    {friend.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">@{friend.username}</p>
                    <p className="text-xs text-gray-400 max-w-[150px] truncate">{friend.email}</p>
                  </div>
                </div>

                {/* Botón Borrar */}
                <button
                    onClick={() => removeFriend(friend.friendship_id, friend.username)}
                    disabled={deleteLoading === friend.friendship_id}
                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    title="Eliminar amigo"
                >
                    {deleteLoading === friend.friendship_id ? "..." : "🗑️"}
                </button>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}