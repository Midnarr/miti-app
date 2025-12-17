import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import AddMemberForm from "@/components/AddMemberForm";
import CreateGroupExpenseForm from "@/components/CreateGroupExpenseForm";

export default async function GroupPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const groupId = params.id;
  console.log("-------------------------------------------------");
  console.log("🔍 DIAGNÓSTICO DE GRUPO - INICIO");
  console.log("🆔 Buscando Grupo ID:", groupId);
  console.log("👤 Usuario actual:", user.email);

  // 1. INTENTO DE OBTENER GRUPO CON REPORTE DE ERROR
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (groupError) {
    console.error("❌ ERROR SUPABASE AL BUSCAR GRUPO:", groupError.message);
    console.error("💡 Detalle:", groupError.details);
    console.error("💡 Hint:", groupError.hint);
  }

  if (!group) {
    console.error("❌ El grupo vino NULO. Causas probables: RLS activado o ID incorrecto.");
    return (
      <div className="p-10 text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-600">🚫 Grupo no encontrado</h1>
        <div className="bg-gray-100 p-4 rounded text-left text-sm font-mono overflow-auto">
          <p><strong>ID Buscado:</strong> {groupId}</p>
          <p><strong>Error de BD:</strong> {groupError ? groupError.message : "Ninguno (Retornó null)"}</p>
          <p><strong>Sugerencia:</strong> Ve a Supabase SQL Editor y ejecuta:</p>
          <code className="block bg-black text-green-400 p-2 mt-2 rounded">
            ALTER TABLE "groups" DISABLE ROW LEVEL SECURITY;
          </code>
        </div>
      </div>
    );
  }

  console.log("✅ Grupo encontrado:", group.name);

  // 2. OBTENER MIEMBROS (Adaptado a tu tabla con member_email)
  const { data: memberRows, error: memberError } = await supabase
    .from("group_members")
    .select("member_email") 
    .eq("group_id", groupId);

  if (memberError) console.error("⚠️ Error buscando miembros:", memberError.message);

  const emails = memberRows?.map((row) => row.member_email) || [];
  console.log("📧 Emails encontrados en el grupo:", emails);

  // 3. OBTENER PERFILES REALES
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, username")
    .in("email", emails);

  const memberObjects = profiles?.map((p) => ({
    id: p.id,
    name: p.email 
  })) || [];

  // 4. MÉTODOS DE PAGO
  const { data: myPaymentMethods } = await supabase
    .from("user_payment_methods")
    .select("*")
    .eq("user_id", user.id);

  // 5. AMIGOS
  const { data: rawFriends } = await supabase
    .from("friends")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
    
  const friendIds = rawFriends?.map(f => f.requester_id === user.id ? f.receiver_id : f.requester_id) || [];
  const { data: friendProfiles } = await supabase.from("profiles").select("id, email, username").in("id", friendIds);
  const myFriends = friendProfiles?.map(p => ({ id: p.id, friend_email: p.email, friend_name: p.username || p.email?.split("@")[0] })) || [];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">{group.name}</h1>
        <p className="text-gray-500 text-sm">ID: {group.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-8">
          <div className="sticky top-8 space-y-8">
             <AddMemberForm groupId={groupId} friends={myFriends} existingEmails={emails} />
             <CreateGroupExpenseForm groupId={groupId} members={memberObjects} myPaymentMethods={myPaymentMethods || []} />
          </div>
        </div>
        <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl border border-dashed border-gray-300 text-center">
                <p className="text-gray-400">Lista de gastos...</p>
            </div>
        </div>
      </div>
    </div>
  );
}