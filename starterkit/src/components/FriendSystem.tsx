"use client";

import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function FriendSystem({ currentUserId }: { currentUserId: string }) {
  const supabase = createClient();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]); // Solicitudes recibidas
  const [friends, setFriends] = useState<any[]>([]);   // Amigos confirmados
  const [loading, setLoading] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    fetchFriendsAndRequests();
  }, []);

  // BUSCADOR EN TIEMPO REAL
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }

    // Buscamos perfiles que coincidan con el username
    const { data } = await supabase
      .from("profiles")
      .select("id, username, email")
      .ilike("username", `%${term}%`) // ilike = case insensitive
      .neq("id", currentUserId)       // No buscarme a mí mismo
      .limit(5);

    setSearchResults(data || []);
  };

  // ENVIAR SOLICITUD
  const sendRequest = async (receiverId: string) => {
    setLoading(true);
    const { error } = await supabase.from("friends").insert({
      requester_id: currentUserId,
      receiver_id: receiverId,
      status: "pending"
    });

    if (error) alert("Ya enviaste solicitud o ya son amigos.");
    else {
      alert("¡Solicitud enviada! 🚀");
      setSearchTerm("");
      setSearchResults([]);
    }
    setLoading(false);
  };

  // ACEPTAR SOLICITUD
  const acceptRequest = async (friendshipId: string) => {
    await supabase.from("friends").update({ status: "accepted" }).eq("id", friendshipId);
    fetchFriendsAndRequests(); // Recargar listas
    router.refresh();
  };

  // OBTENER MIS DATOS
  const fetchFriendsAndRequests = async () => {
    // 1. Buscar solicitudes pendientes (donde yo soy el receiver)
    const { data: reqData } = await supabase
      .from("friends")
      .select("*, profiles:requester_id(username, email)") // Join manual
      .eq("receiver_id", currentUserId)
      .eq("status", "pending");

    // NOTA: Supabase a veces necesita configuración extra para joins complejos. 
    // Si 'profiles:requester_id' falla, habría que hacer fetch manual, pero probemos así.
    // Para simplificar, asumiremos que funciona o ajustaremos.
    
    // Mejor estrategia manual para evitar errores de relación complejos en SQL simple:
    // Traemos las solicitudes y luego buscamos los nombres.
    if (reqData && reqData.length > 0) {
       const requesterIds = reqData.map(r => r.requester_id);
       const { data: profiles } = await supabase.from("profiles").select("*").in("id", requesterIds);
       
       // Combinamos datos
       const combinedRequests = reqData.map(r => ({
          ...r,
          requester: profiles?.find(p => p.id === r.requester_id)
       }));
       setRequests(combinedRequests);
    } else {
       setRequests([]);
    }


    // 2. Buscar Amigos Aceptados (Soy requester O receiver)
    const { data: friendsData } = await supabase
      .from("friends")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    if (friendsData && friendsData.length > 0) {
        // Sacar IDs de los amigos (el que NO soy yo)
        const friendIds = friendsData.map(f => 
            f.requester_id === currentUserId ? f.receiver_id : f.requester_id
        );
        const { data: friendProfiles } = await supabase.from("profiles").select("*").in("id", friendIds);
        setFriends(friendProfiles || []);
    } else {
        setFriends([]);
    }
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

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <div className="mt-2 border rounded-lg overflow-hidden bg-gray-50">
            {searchResults.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-3 hover:bg-indigo-50 transition-colors">
                <div>
                  <p className="font-bold text-gray-800">@{user.username}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
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

      {/* 2. SOLICITUDES PENDIENTES */}
      {requests.length > 0 && (
        <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
          <h3 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
            🔔 Solicitudes Recibidas <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{requests.length}</span>
          </h3>
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                <div>
                   <p className="font-bold text-gray-800">@{req.requester?.username || "Usuario"}</p>
                   <p className="text-xs text-gray-500">Quiere ser tu amigo</p>
                </div>
                <div className="flex gap-2">
                   <button 
                     onClick={() => acceptRequest(req.id)}
                     className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-full font-bold hover:bg-green-600"
                   >
                     Aceptar
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. LISTA DE AMIGOS */}
      <div>
        <h3 className="font-bold text-gray-800 mb-4 text-xl">Mis Amigos ({friends.length})</h3>
        {friends.length === 0 ? (
          <p className="text-gray-400 italic">No tienes amigos agregados aún.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((friend) => (
              <div key={friend.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">
                  {friend.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">@{friend.username}</p>
                  <p className="text-xs text-gray-400">{friend.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}