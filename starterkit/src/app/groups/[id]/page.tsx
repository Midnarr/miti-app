import { createClient } from "@/libs/supabase/server";
import { notFound, redirect } from "next/navigation";
import CreateGroupExpenseForm from "@/components/CreateGroupExpenseForm";
import ExpenseStatusButtons from "@/components/ExpenseStatusButtons";
import AddMemberForm from "@/components/AddMemberForm";
import GroupMemberList from "@/components/GroupMemberList"; // 👈 IMPORTAR NUEVO
import Link from "next/link";

export default async function GroupDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const groupId = params.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. GRUPO
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (groupError || !group) return notFound();

  // 2. MIEMBROS (Obtener emails)
  const { data: membersData } = await supabase
    .from("group_members")
    .select("member_email") 
    .eq("group_id", groupId);

  const memberEmails = membersData?.map(m => m.member_email) || [];

  // 🚨 SEGURIDAD
  const currentUserEmail = user.email!.toLowerCase().trim();
  const isMember = memberEmails.some(email => email.toLowerCase().trim() === currentUserEmail);
  if (!isMember) return notFound();

  // 3. OBTENER PERFILES COMPLETOS DE LOS MIEMBROS (Para tener Username y ID)
  // Buscamos en la tabla profiles todos los emails que estén en este grupo
  const { data: memberProfiles } = await supabase
    .from("profiles")
    .select("id, email, username")
    .in("email", memberEmails);

  // Formateamos la lista de miembros para el componente visual
  const fullMembers = memberEmails.map(email => {
    const profile = memberProfiles?.find(p => p.email === email);
    return {
      email: email,
      // Si tiene perfil con username lo usamos, si no, cortamos el email
      username: profile?.username || email.split("@")[0],
      id: profile?.id || "unknown"
    };
  });

  // 4. AMIGOS (Para el form de agregar)
  const { data: rawFriends } = await supabase
    .from("friends")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

  const friendIds = rawFriends?.map(f => f.requester_id === user.id ? f.receiver_id : f.requester_id) || [];
  const { data: profiles } = await supabase.from("profiles").select("id, email, username").in("id", friendIds);
  
  const myFriends = profiles?.map(p => ({
    id: p.id,
    friend_email: p.email,
    friend_name: p.username || p.email?.split("@")[0]
  })) || [];

  // 5. GASTOS
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      
      {/* CABECERA REDISEÑADA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 flex flex-col lg:flex-row gap-8">
        
        {/* Lado Izquierdo: Título y Lista de Miembros */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
             <Link href="/dashboard/groups" className="text-gray-400 hover:text-indigo-600 transition-colors">←</Link>
             <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
          </div>
          
          {/* 👇 AQUÍ ESTÁ EL NUEVO COMPONENTE DE LISTA */}
          <GroupMemberList 
            groupId={groupId}
            members={fullMembers}
            currentUserId={user.id}
            creatorId={group.created_by} // Pasamos el ID del creador
          />
        </div>

        {/* Lado Derecho: Resumen Total */}
        <div className="flex flex-col items-end justify-start">
           <div className="bg-indigo-50 px-6 py-4 rounded-xl text-center">
              <span className="block text-3xl font-bold text-indigo-700">{expenses?.length || 0}</span>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Gastos Totales</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Formularios */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <AddMemberForm groupId={groupId} friends={myFriends} existingEmails={memberEmails} />
            <CreateGroupExpenseForm groupId={groupId} members={memberEmails} currentUserEmail={user.email!} friends={myFriends} />
          </div>
        </div>

        {/* COLUMNA DERECHA: Lista de Gastos */}
        <div className="lg:col-span-2 space-y-4">
           <h2 className="font-bold text-xl text-gray-800">Historial</h2>
           {!expenses || expenses.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                <p className="mb-2 text-4xl">💸</p>
                <p>No hay gastos registrados aún.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense) => {
                  const expenseDebtor = expense.debtor_email.toLowerCase().trim();
                  const isMePayer = expense.payer_id === user.id;
                  const isMeDebtor = expenseDebtor === currentUserEmail;

                  let labelText = isMePayer ? "Le cobraste a:" : (isMeDebtor ? "Te cobraron a:" : "Le cobraron a:");
                  let valueText = isMePayer ? (isMeDebtor ? "Ti mismo" : expense.debtor_email) : (isMeDebtor ? "Ti" : expense.debtor_email);
                  
                  // Intentamos buscar el username del deudor para que se vea bonito en la tarjeta también
                  const debtorProfile = memberProfiles?.find(p => p.email === expenseDebtor);
                  const debtorName = debtorProfile?.username ? `@${debtorProfile.username}` : valueText;

                  let borderColor = "border-gray-100";
                  if (expense.status === 'proposed') borderColor = "border-indigo-200";
                  if (expense.status === 'pending') borderColor = "border-orange-200";
                  if (expense.status === 'paid') borderColor = "border-green-200";

                  return (
                    <div key={expense.id} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${borderColor} flex justify-between items-center transition-all hover:shadow-md`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{expense.description}</p>
                          {expense.receipt_url && <a href={expense.receipt_url} target="_blank" className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 hover:bg-blue-100 transition-colors">📎 Ticket</a>}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {labelText} <span className="font-medium text-indigo-600">{debtorName}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="block font-bold text-lg text-gray-800">${expense.amount}</span>
                        <ExpenseStatusButtons expenseId={expense.id} currentStatus={expense.status} isDebtor={isMeDebtor} isPayer={isMePayer} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}