import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import AddMemberForm from "@/components/AddMemberForm";
import CreateGroupExpenseForm from "@/components/CreateGroupExpenseForm";
// import GroupExpensesList from "@/components/GroupExpensesList"; // Descomenta si ya tienes este componente

export default async function GroupPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const groupId = params.id;

  // 1. Obtener datos del grupo
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (!group) return <div className="p-8 text-center text-gray-500">Grupo no encontrado</div>;

  // ... dentro de src/app/groups/[id]/page.tsx

  // 2. Obtener miembros
  const { data: membersRel } = await supabase
    .from("group_members")
    // 👇 CAMBIO AQUÍ: Reemplaza "user_id" por "profile_id" (o como se llame en tu tabla)
    .select("profile_id, profiles(email, username)") 
    .eq("group_id", groupId);

  const memberObjects = membersRel?.map((m: any) => ({
    // 👇 CAMBIO AQUÍ TAMBIÉN: Usa el nombre real de tu columna
    id: m.profile_id, 
    name: m.profiles?.email || "Usuario"
  })) || [];

  // 3. Obtener mis amigos (Para el formulario de agregar miembro)
  const { data: rawFriends } = await supabase
    .from("friends")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

  const friendIds = rawFriends?.map(f => 
      f.requester_id === user.id ? f.receiver_id : f.requester_id
  ) || [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, username")
    .in("id", friendIds);

  const myFriends = profiles?.map(p => ({
    id: p.id,
    friend_email: p.email,
    friend_name: p.username || p.email?.split("@")[0]
  })) || [];

  // 4. Obtener MIS métodos de pago
  const { data: myPaymentMethods } = await supabase
    .from("user_payment_methods")
    .select("*")
    .eq("user_id", user.id);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">{group.name}</h1>
        <p className="text-gray-500 text-sm">Gestiona los gastos de este grupo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: Formularios */}
        <div className="lg:col-span-1 space-y-8">
          <div className="sticky top-8 space-y-8">
             
             {/* 👇 AQUÍ ESTABA EL ERROR: Usamos .map() para pasar solo los textos */}
             <AddMemberForm 
                groupId={groupId} 
                friends={myFriends} 
                existingEmails={memberObjects.map(m => m.name)} 
             />

             {/* 👇 Este componente SÍ necesita los objetos completos */}
             <CreateGroupExpenseForm 
                groupId={groupId} 
                members={memberObjects} 
                myPaymentMethods={myPaymentMethods || []} 
             />
          </div>
        </div>

        {/* COLUMNA DERECHA: Lista de Gastos */}
        <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl border border-dashed border-gray-300 text-center">
                <p className="text-gray-400">Aquí irá la lista de gastos del grupo...</p>
                {/* <GroupExpensesList groupId={groupId} ... /> */}
            </div>
        </div>
      </div>
    </div>
  );
}