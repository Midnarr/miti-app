import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import CreateExpenseForm from "@/components/CreateExpenseForm";
import ExpenseStatusButtons from "@/components/ExpenseStatusButtons";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Obtener PERFILES (Para traducir email -> username)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("email, username");

  const userMap: Record<string, string> = {};
  profiles?.forEach((p) => {
    if (p.email) userMap[p.email] = p.username || p.email;
  });

  const getDisplayName = (email: string) => {
    if (email === user.email) return "Tú";
    const name = userMap[email];
    return name ? `@${name}` : email;
  };

  // 2. DEUDAS (Me cobran a mí)
  const { data: debts } = await supabase
    .from("expenses")
    .select("*, groups(name)") 
    .eq("debtor_email", user.email)
    .order("created_at", { ascending: false });

  // 3. COBROS (Yo cobro a otros)
  const { data: receivables } = await supabase
    .from("expenses")
    .select("*, groups(name)")
    .eq("payer_id", user.id)
    .order("created_at", { ascending: false });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: '2-digit', month: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <h1 className="text-3xl font-bold text-gray-800">
          Hola, <span className="text-indigo-600">{userMap[user.email!] || "Usuario"}</span> 👋
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA: CREAR GASTO */}
          <div className="md:col-span-1">
            <CreateExpenseForm />
          </div>

          {/* COLUMNA DERECHA: LISTAS */}
          <div className="md:col-span-2 space-y-8">
            
            {/* --- SECCIÓN 1: TE ESTÁN COBRANDO (DEUDAS) --- */}
            <div className="bg-white p-6 rounded-xl shadow border border-orange-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
              <h2 className="font-bold text-xl mb-4 text-orange-700 flex items-center gap-2">
                🔔 Tienes que pagar
                {debts?.filter(d => d.status === 'pending').length! > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                    {debts?.filter(d => d.status === 'pending').length} nuevos
                  </span>
                )}
              </h2>

              {debts?.length === 0 ? (
                <p className="text-gray-400 text-sm italic">Estás al día. ¡Genial!</p>
              ) : (
                <div className="space-y-4">
                  {debts?.map((expense) => (
                    <div key={expense.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {/* ETIQUETA DE GRUPO */}
                            {/* @ts-ignore */}
                            {expense.groups && (
                              <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                👥 {/* @ts-ignore */} {expense.groups.name}
                              </span>
                            )}
                            <p className="font-semibold text-gray-800">{expense.description}</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 text-sm mt-1 items-center">
                            {expense.original_amount && expense.original_amount !== expense.amount ? (
                              <>
                                <span className="text-gray-400 line-through text-xs">
                                  Total: ${expense.original_amount}
                                </span>
                                <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                  Tu parte: ${expense.amount}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-gray-700">
                                A pagar: ${expense.amount}
                              </span>
                            )}
                          </div>

                          {/* ENLACE AL RECIBO (DEUDOR) */}
                          {expense.receipt_url && (
                            <a 
                              href={expense.receipt_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-2"
                            >
                              📎 Ver recibo
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <ExpenseStatusButtons 
                          expenseId={expense.id} 
                          currentStatus={expense.status!} 
                          isDebtor={true} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --- SECCIÓN 2: TUS COBROS (LO QUE TE DEBEN) --- */}
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
              <h2 className="font-bold text-xl mb-4 text-gray-700 flex items-center gap-2">
                💰 Te deben a ti
              </h2>

              {receivables?.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No has creado cobros pendientes.</p>
              ) : (
                <div className="space-y-4">
                  {receivables?.map((expense) => (
                    <div key={expense.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {/* ETIQUETA DE GRUPO */}
                            {/* @ts-ignore */}
                            {expense.groups && (
                              <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                👥 {/* @ts-ignore */} {expense.groups.name}
                              </span>
                            )}
                            <p className="font-medium text-gray-800">{expense.description}</p>
                          </div>

                          <p className="text-sm text-gray-500 mb-1">
                            A: <strong className="text-indigo-600">{getDisplayName(expense.debtor_email)}</strong>
                          </p>
                          
                           <div className="flex flex-wrap gap-2 text-sm items-center">
                            {expense.original_amount && expense.original_amount !== expense.amount ? (
                              <>
                                <span className="text-gray-400 line-through text-xs">
                                  Total: ${expense.original_amount}
                                </span>
                                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                  Te debe: ${expense.amount}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-gray-700">
                                Monto: ${expense.amount}
                              </span>
                            )}
                          </div>

                          {/* ENLACE AL RECIBO (ACREEDOR) - CORREGIDO */}
                          {expense.receipt_url && (
                            <a 
                              href={expense.receipt_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-2"
                            >
                              📎 Ver recibo
                            </a>
                          )}

                        </div>

                        <div className="flex flex-col items-end gap-2">
                           <ExpenseStatusButtons 
                              expenseId={expense.id} 
                              currentStatus={expense.status!} 
                              isDebtor={false} 
                            />
                            <span className="text-[10px] text-gray-400">{formatDate(expense.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  ); 
}