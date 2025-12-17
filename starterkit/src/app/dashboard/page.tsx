import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import CreateExpenseForm from "@/components/CreateExpenseForm";
import ExpenseStatusButtons from "@/components/ExpenseStatusButtons";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. OBTENER MI PERFIL (Para mostrar mi nombre en el saludo)
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const displayUsername = myProfile?.username ? `@${myProfile.username}` : user.email?.split("@")[0];

  // 2. OBTENER MIS MÉTODOS DE PAGO GUARDADOS
  // (Esto es necesario para pasárselo al formulario y que puedas elegir tu CBU al crear un gasto)
  const { data: myPaymentMethods } = await supabase
    .from("user_payment_methods")
    .select("*")
    .eq("user_id", user.id);

  // 3. OBTENER GASTOS
  // Usamos la relación !payer_id para traer datos del creador del gasto
  const { data: allExpenses } = await supabase
    .from("expenses")
    .select(`
      *,
      groups(name),
      payer:profiles!payer_id (
        username,
        email
      )
    `)
    .or(`payer_id.eq.${user.id},debtor_email.eq.${user.email}`)
    .order("created_at", { ascending: false });

  const expenses = allExpenses || [];

  // 4. OBTENER AMIGOS
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
  
  // --- FILTROS DE ESTADO ---
  const iOwe = expenses.filter((e) => e.debtor_email === user.email && e.status !== "paid");
  const owedToMe = expenses.filter((e) => e.payer_id === user.id && e.status !== "paid");
  const iPaid = expenses.filter((e) => e.debtor_email === user.email && e.status === "paid");

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      
      {/* HEADER */}
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
        Hola, <span className="text-indigo-600">{displayUsername}</span> 👋
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: Formulario */}
        <div className="md:col-span-1 space-y-8">
           <CreateExpenseForm 
              currentUserEmail={user.email!} 
              friends={myFriends} 
              myPaymentMethods={myPaymentMethods || []} 
           />
        </div>

        {/* COLUMNA DERECHA: Listados */}
        <div className="md:col-span-2 space-y-8">
          
          {/* --- BLOQUE 1: TIENES QUE PAGAR --- */}
          <div className="bg-orange-50/50 p-6 rounded-xl shadow-sm border border-orange-100">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-bold text-xl text-gray-800">🔔 Tienes que pagar</h2>
              {iOwe.length > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{iOwe.length} nuevos</span>}
            </div>

            {iOwe.length === 0 ? <p className="text-gray-500 text-sm">¡Estás al día! 🎉</p> : (
              <div className="space-y-4">
                {iOwe.map((expense) => {
                  // @ts-ignore
                  const lenderName = expense.payer?.username || expense.payer?.email?.split("@")[0] || "Desconocido";

                  return (
                    <div key={expense.id} className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1">
                          {/* Categoría y Descripción */}
                          <div className="flex items-center gap-2">
                            {(expense.groups as any)?.name && <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">#{(expense.groups as any).name}</span>}
                            <span className="font-bold text-gray-900">{expense.description}</span>
                          </div>
                          
                          {/* Ticket */}
                          {expense.receipt_url && <a href={expense.receipt_url} target="_blank" className="inline-flex items-center gap-1 w-fit text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">📎 Ver Ticket</a>}

                          {/* INFORMACIÓN EXTRA DE PAGO (Si es transferencia) */}
                          {expense.payment_method_type === 'transfer' && expense.payment_details && (
                             <div className="mt-1 p-2 bg-purple-50 rounded border border-purple-100 text-[11px] text-purple-800">
                               <p className="font-bold mb-0.5">Datos para transferir:</p>
                               <p className="font-mono select-all bg-white px-1 rounded border border-purple-100 inline-block">
                                 {expense.payment_details}
                               </p>
                             </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 font-medium whitespace-nowrap ml-2">{formatDate(expense.created_at)}</span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mb-3">
                        Le debes a: <span className="font-bold text-orange-600">@{lenderName}</span>
                      </p>

                      <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                        <div className="text-sm text-gray-600">
                          <span className="bg-orange-100 text-orange-800 font-bold px-2 py-1 rounded-md">Pagar: ${expense.amount}</span>
                        </div>
                        
                        {/* BOTONES DE ACCIÓN */}
                        <ExpenseStatusButtons 
                          expenseId={expense.id} 
                          currentStatus={expense.status} 
                          isDebtor={true} 
                          isPayer={false} 
                          paymentMethod={expense.payment_method_type}
                          paymentDetails={expense.payment_details}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* --- BLOQUE 2: TE DEBEN A TI --- */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h2 className="font-bold text-xl text-gray-800 mb-6">💰 Te deben a ti</h2>
             {owedToMe.length === 0 ? <p className="text-gray-500 text-sm">Nadie te debe dinero.</p> : (
              <div className="space-y-4">
                {owedToMe.map((expense) => (
                  <div key={expense.id} className="p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow bg-gray-50/50">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-gray-900 text-lg">{expense.description}</span>
                          {expense.receipt_url && <a href={expense.receipt_url} target="_blank" className="inline-flex items-center gap-1 w-fit text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">📎 Ver Ticket</a>}
                          
                          {/* Recordatorio de cómo pediste cobrar */}
                          {expense.payment_method_type === 'transfer' && (
                             <span className="text-[10px] text-gray-400">Pediste transferencia a: {expense.payment_details}</span>
                          )}
                          {expense.payment_method_type === 'cash' && (
                             <span className="text-[10px] text-gray-400">Cobro en Efectivo</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{formatDate(expense.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">A: <span className="font-semibold text-indigo-600">{expense.debtor_email}</span></p>
                    <div className="flex justify-between items-end border-t border-gray-200 pt-2">
                      <div className="text-sm text-gray-600">
                        <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded-md">Te debe: ${expense.amount}</span>
                      </div>
                      
                      {/* BOTONES DE ACCIÓN (ACREEDOR) */}
                      <ExpenseStatusButtons 
                        expenseId={expense.id} 
                        currentStatus={expense.status} 
                        isDebtor={false} 
                        isPayer={true}
                        paymentMethod={expense.payment_method_type}
                        paymentDetails={expense.payment_details}
                      />
                    </div>
                  </div>
                ))}
              </div>
             )}
          </div>

          {/* --- BLOQUE 3: HISTORIAL DE PAGOS REALIZADOS --- */}
          {iPaid.length > 0 && (
            <div className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200 opacity-90">
              <h2 className="font-bold text-xl text-gray-700 mb-6 flex items-center gap-2">
                ✅ Historial de Pagos <span className="text-xs font-normal text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{iPaid.length}</span>
              </h2>
              
              <div className="space-y-3">
                {iPaid.map((expense) => {
                   // @ts-ignore
                   const paidToName = expense.payer?.username || expense.payer?.email?.split("@")[0] || "Alguien";

                   return (
                    <div key={expense.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 opacity-75 hover:opacity-100 transition-opacity">
                      <div>
                        <p className="font-bold text-gray-700 line-through decoration-gray-400">{expense.description}</p>
                        <p className="text-xs text-gray-500">
                          Pagaste a <span className="font-semibold">@{paidToName}</span> • {formatDate(expense.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-gray-400 line-through text-sm">${expense.amount}</span>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">PAGADO</span>
                      </div>
                    </div>
                   )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}