import { createClient } from "@/libs/supabase/server";
import { notFound, redirect } from "next/navigation";
import CreateGroupExpenseForm from "@/components/CreateGroupExpenseForm";
import ExpenseStatusButtons from "@/components/ExpenseStatusButtons";
import AddMemberForm from "@/components/AddMemberForm";
import Link from "next/link";

export default async function GroupDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const groupId = params.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. OBTENER EL GRUPO
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (groupError || !group) return notFound();

  // 2. OBTENER MIEMBROS
  const { data: membersData } = await supabase
    .from("group_members")
    .select("member_email") 
    .eq("group_id", groupId);

  const memberEmails = membersData?.map(m => m.member_email) || [];

  // 🚨 --- ZONA DE SEGURIDAD --- 🚨
  // Verificamos si el usuario actual está en la lista de miembros.
  // Usamos toLowerCase() y trim() para evitar errores por mayúsculas o espacios.
  const currentUserEmail = user.email!.toLowerCase().trim();
  const isMember = memberEmails.some(email => email.toLowerCase().trim() === currentUserEmail);

  if (!isMember) {
    // Si NO es miembro, lo mandamos a una página 404 (o podrías usar redirect("/dashboard"))
    return notFound();
  }
  // -----------------------------

  // 3. OBTENER AMIGOS (SISTEMA SOCIAL)
  const { data: rawFriends } = await supabase
    .from("friends")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

  const friendIds = rawFriends?.map(f => 
      f.requester_id === user.id ? f.receiver_id : f.requester_id
  ) || [];

  // 4. PERFILES DE AMIGOS
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, username")
    .in("id", friendIds);

  const myFriends = profiles?.map(p => ({
    id: p.id,
    friend_email: p.email,
    friend_name: p.username || p.email?.split("@")[0]
  })) || [];

  // 5. OBTENER GASTOS
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      
      {/* CABECERA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
             <Link href="/dashboard/groups" className="text-gray-400 hover:text-indigo-600 transition-colors">←</Link>
             <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
          </div>
          <p className="text-gray-500 mt-1 ml-8 text-sm">
            Miembros: <span className="text-indigo-600">{memberEmails.join(", ")}</span>
          </p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-lg">
           <span className="font-bold text-indigo-700">Total Gastos: {expenses?.length || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* IZQUIERDA: FORMULARIO + AGREGAR MIEMBRO */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            
            <AddMemberForm 
              groupId={groupId} 
              friends={myFriends} 
              existingEmails={memberEmails}
            />

            <CreateGroupExpenseForm 
              groupId={groupId} 
              members={memberEmails} 
              currentUserEmail={user.email!}
              friends={myFriends}
            />
          </div>
        </div>

        {/* DERECHA: GASTOS */}
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
                  const isMePayer = expense.payer_id === user.id;
                  const isMeDebtor = expense.debtor_email === user.email;
                  let borderColor = "border-gray-100";
                  if (expense.status === 'proposed') borderColor = "border-indigo-200";
                  if (expense.status === 'pending') borderColor = "border-orange-200";
                  if (expense.status === 'paid') borderColor = "border-green-200";

                  return (
                    <div key={expense.id} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${borderColor} flex justify-between items-center transition-all hover:shadow-md`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{expense.description}</p>
                          {expense.receipt_url && <a href={expense.receipt_url} target="_blank" className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center gap-1">📎 Ticket</a>}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {isMePayer ? "Le cobraste a:" : "Te cobró:"} <span className="font-medium text-indigo-600">{isMeDebtor ? "Ti" : expense.debtor_email}</span>
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