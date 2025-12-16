import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import CreateExpenseForm from "@/components/CreateExpenseForm";
import ExpenseStatusButtons from "@/components/ExpenseStatusButtons";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Obtener gastos
  const { data: allExpenses } = await supabase
    .from("expenses")
    .select("*, groups(name)")
    .or(`payer_id.eq.${user.id},debtor_email.eq.${user.email}`)
    .order("created_at", { ascending: false });

  const expenses = allExpenses || [];

  // 2. Obtener amigos (para el formulario)
  const { data: friends } = await supabase
    .from("friends")
    .select("*")
    .order("friend_name", { ascending: true });

  const myFriends = friends || [];

  // Filtros
  const iOwe = expenses.filter((e) => e.debtor_email === user.email && e.status !== "paid");
  const owedToMe = expenses.filter((e) => e.payer_id === user.id);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };
  
  const username = user.email?.split("@")[0];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
        Hola, <span className="text-indigo-600">{username}</span> 👋
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: Formulario */}
        <div className="md:col-span-1 space-y-8">
           <CreateExpenseForm currentUserEmail={user.email!} friends={myFriends} />
        </div>

        {/* COLUMNA DERECHA: Resúmenes */}
        <div className="md:col-span-2 space-y-8">
          
          {/* --- SECCIÓN 1: TIENES QUE PAGAR --- */}
          <div className="bg-orange-50/50 p-6 rounded-xl shadow-sm border border-orange-100">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-bold text-xl text-gray-800">🔔 Tienes que pagar</h2>
              {iOwe.length > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{iOwe.length} nuevos</span>}
            </div>

            {iOwe.length === 0 ? (
              <p className="text-gray-500 text-sm">¡Estás al día! 🎉</p>
            ) : (
              <div className="space-y-4">
                {iOwe.map((expense) => (
                  <div key={expense.id} className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm">
                    {/* Fila Superior */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {(expense.groups as any)?.name && (
                            <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                              #{(expense.groups as any).name}
                            </span>
                          )}
                          <span className="font-bold text-gray-900">{expense.description}</span>
                        </div>
                        
                        {/* 📎 BOTÓN DE RECIBO (Azul y visible) */}
                        {expense.receipt_url && (
                          <a 
                            href={expense.receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 w-fit text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                          >
                            📎 Ver Ticket
                          </a>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{formatDate(expense.created_at)}</span>
                    </div>

                    {/* Fila Inferior */}
                    <div className="flex justify-between items-end">
                      <div className="text-sm text-gray-600">
                        <span className="mr-2">Total: ${expense.original_amount}</span>
                        <span className="bg-orange-100 text-orange-800 font-bold px-2 py-1 rounded-md">
                          Tu parte: ${expense.amount}
                        </span>
                      </div>
                      <ExpenseStatusButtons expenseId={expense.id} currentStatus={expense.status} isDebtor={true} isPayer={false} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- SECCIÓN 2: TE DEBEN A TI --- */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h2 className="font-bold text-xl text-gray-800 mb-6">💰 Te deben a ti</h2>
             
             {owedToMe.length === 0 ? (
              <p className="text-gray-500 text-sm">Nadie te debe dinero.</p>
            ) : (
              <div className="space-y-4">
                {owedToMe.map((expense) => (
                  <div key={expense.id} className="p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow bg-gray-50/50">
                    {/* Fila Superior */}
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex flex-col gap-1">
                          <span className="font-bold text-gray-900 text-lg">{expense.description}</span>
                          
                          {/* 📎 BOTÓN DE RECIBO (Azul y visible) */}
                          {expense.receipt_url && (
                            <a 
                              href={expense.receipt_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 w-fit text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                            >
                              📎 Ver Ticket
                            </a>
                          )}
                       </div>
                       <span className="text-xs text-gray-400 font-medium">{formatDate(expense.created_at)}</span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      A: <span className="font-semibold text-indigo-600">{expense.debtor_email}</span>
                    </p>

                    {/* Fila Inferior */}
                    <div className="flex justify-between items-end">
                      <div className="text-sm text-gray-600">
                        <span className="mr-2">Total: ${expense.original_amount}</span>
                        <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded-md">
                          Te debe: ${expense.amount}
                        </span>
                      </div>
                      <ExpenseStatusButtons expenseId={expense.id} currentStatus={expense.status} isDebtor={false} isPayer={true} />
                    </div>
                  </div>
                ))}
              </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}