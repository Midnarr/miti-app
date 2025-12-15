import { createClient } from "@/libs/supabase/server";
import { notFound, redirect } from "next/navigation";
import CreateGroupExpenseForm from "@/components/CreateGroupExpenseForm";
import ExpenseStatusButtons from "@/components/ExpenseStatusButtons";
import Link from "next/link";

export default async function GroupDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const groupId = params.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. OBTENER GRUPO
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (!group) return notFound();

  // 2. OBTENER MIEMBROS (VERSIÓN LIMPIA) 🧹
  // Ahora solo buscamos 'member_email' directamente
  const { data: membersData } = await supabase
    .from("group_members")
    .select("member_email") 
    .eq("group_id", groupId);

  // Mapeamos directamente porque la base de datos ya asegura que no sean nulos
  const memberEmails = membersData?.map(m => m.member_email) || [];

  // 3. OBTENER PERFILES (Para mostrar nombres bonitos)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, username");

  const idToNameMap: Record<string, string> = {};
  const emailToNameMap: Record<string, string> = {};

  profiles?.forEach((p) => {
    const name = p.username ? `@${p.username}` : (p.email || "Usuario");
    if (p.id) idToNameMap[p.id] = name;
    if (p.email) emailToNameMap[p.email] = name;
  });

  const getPayerName = (payerId: string) => {
    if (payerId === user.id) return "Tú";
    return idToNameMap[payerId] || "Alguien";
  };

  const getDebtorName = (debtorEmail: string) => {
    if (debtorEmail === user.email) return "Ti";
    return emailToNameMap[debtorEmail] || debtorEmail?.split('@')[0] || "Miembro";
  };

  // 4. OBTENER GASTOS
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: '2-digit', month: 'short'
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
        <div>
          <div className="flex items-center gap-3">
             <Link href="/dashboard/groups" className="text-gray-400 hover:text-indigo-600 transition-colors">
               ←
             </Link>
             <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
          </div>
          <p className="text-gray-500 mt-1 ml-6 text-sm">
            Miembros: {memberEmails.join(", ")}
          </p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-lg">
          <span className="font-bold text-indigo-700 text-lg">Total gastos: {expenses?.length || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* IZQUIERDA: FORMULARIO */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <CreateGroupExpenseForm 
              groupId={groupId} 
              members={memberEmails} // Pasamos la lista limpia de strings
              currentUserEmail={user.email!}
            />
          </div>
        </div>

        {/* DERECHA: LISTA DE GASTOS */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-xl text-gray-800">Historial del Grupo</h2>
          
          {expenses?.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
              <p className="mb-2 text-4xl">💸</p>
              <p>No hay gastos registrados aún.</p>
              <p className="text-sm">¡Sé el primero en agregar uno!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses?.map((expense) => {
                const isMePayer = expense.payer_id === user.id;
                const isMeDebtor = expense.debtor_email === user.email;
                
                // Estilos dinámicos
                let cardStyle = "bg-white border-l-4 border-gray-200"; 
                if (isMeDebtor && expense.status === 'pending') cardStyle = "bg-orange-50/50 border-l-4 border-orange-400";
                if (isMePayer && expense.status === 'pending') cardStyle = "bg-indigo-50/50 border-l-4 border-indigo-500";
                if (expense.status === 'paid') cardStyle = "bg-green-50/30 border-l-4 border-green-400 opacity-75";

                return (
                  <div key={expense.id} className={`p-5 rounded-lg shadow-sm border border-gray-100 ${cardStyle} transition-all hover:shadow-md`}>
                    <div className="flex justify-between items-start gap-4">
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-lg">{expense.description}</span>
                          {expense.status === 'paid' && (
                            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Pagado</span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          <span className="font-semibold text-indigo-700">{getPayerName(expense.payer_id)}</span> pagó por{" "}
                          <span className="font-semibold text-orange-700">{getDebtorName(expense.debtor_email)}</span>
                        </p>

                        <div className="flex items-center gap-3 text-sm">
                           {expense.original_amount && expense.original_amount !== expense.amount ? (
                              <>
                                <span className="text-gray-400 line-through text-xs">${expense.original_amount}</span>
                                <span className={`font-bold px-2 py-1 rounded border ${
                                  isMeDebtor ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-gray-100 text-gray-800 border-gray-200"
                                }`}>
                                  ${expense.amount}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold bg-gray-100 px-2 py-1 rounded text-gray-800 border border-gray-200">
                                ${expense.amount}
                              </span>
                            )}
                            
                            {expense.receipt_url && (
                            <a href={expense.receipt_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                              📎 Recibo
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-gray-400 font-medium">{formatDate(expense.created_at)}</span>
                        {(isMePayer || isMeDebtor) && (
                          <ExpenseStatusButtons 
                            expenseId={expense.id} 
                            currentStatus={expense.status} 
                            isDebtor={isMeDebtor} 
                          />
                        )}
                      </div>

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