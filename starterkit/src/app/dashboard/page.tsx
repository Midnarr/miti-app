import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import CreateExpenseForm from "@/components/CreateExpenseForm";
import ExpenseStatusButtons from "@/components/ExpenseStatusButtons";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. OBTENER TODOS LOS PERFILES (Estrategia segura)
  // Traemos todos los usuarios para poder buscar sus nombres por ID o Email manualmente
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, username");

  // Creamos diccionarios para búsqueda rápida
  const idToNameMap: Record<string, string> = {};
  const emailToNameMap: Record<string, string> = {};

  profiles?.forEach((p) => {
    const name = p.username || p.email || "Usuario";
    if (p.id) idToNameMap[p.id] = name;
    if (p.email) emailToNameMap[p.email] = name;
  });

  // Helper para obtener nombre (Tú, Username o Email)
  const getUserNameById = (userId: string) => {
    if (userId === user.id) return "Tú";
    return idToNameMap[userId] ? `@${idToNameMap[userId]}` : "Alguien";
  };

  const getUserNameByEmail = (email: string) => {
    if (email === user.email) return "Ti"; // Para "Te debe a Ti"
    return emailToNameMap[email] ? `@${emailToNameMap[email]}` : email;
  };

  // 2. OBTENER GASTOS (Sin Joins complejos para evitar errores)
  const { data: debts } = await supabase
    .from("expenses")
    .select("*, groups(name)") 
    .eq("debtor_email", user.email)
    .order("created_at", { ascending: false });

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
    <div className="min-h-screen bg-white p-4 md:p-8"> 
      <div className="max-w-5xl mx-auto space-y-8">
        
        <h1 className="text-3xl font-extrabold text-gray-900">
          Hola, <span className="text-indigo-700">{idToNameMap[user.id] || "Usuario"}</span> 👋
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA: CREAR GASTO */}
          <div className="md:col-span-1">
            <CreateExpenseForm />
          </div>

          {/* COLUMNA DERECHA: LISTAS */}
          <div className="md:col-span-2 space-y-8">
            
            {/* --- SECCIÓN 1: DEUDAS (A QUIÉN LE DEBES) --- */}
            <div className="bg-orange-50/50 p-6 rounded-xl shadow-sm border border-orange-100">
              <h2 className="font-bold text-xl mb-4 text-orange-800 flex items-center gap-2">
                🔔 Tienes que pagar
                {debts?.filter(d => d.status === 'pending').length! > 0 && (
                  <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full animate-pulse font-bold">
                    {debts?.filter(d => d.status === 'pending').length} nuevos
                  </span>
                )}
              </h2>

              {debts?.length === 0 ? (
                <p className="text-gray-600 text-sm italic">Estás al día. ¡Genial!</p>
              ) : (
                <div className="space-y-4 bg-white p-4 rounded-lg border border-orange-100">
                  {debts?.map((expense) => (
                    <div key={expense.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             {/* @ts-ignore */}
                            {expense.groups && (
                              <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                👥 {/* @ts-ignore */} {expense.groups.name}
                              </span>
                            )}
                            <p className="font-bold text-gray-900 text-lg">{expense.description}</p>
                          </div>
                          
                          {/* A QUIÉN LE DEBES (Usando el mapa seguro) */}
                          <p className="text-sm text-gray-600 mb-2">
                            Le debes a: <strong className="text-indigo-700">{getUserNameById(expense.payer_id)}</strong>
                          </p>

                          <div className="flex flex-wrap gap-2 text-sm mt-1 items-center">
                            {expense.original_amount && expense.original_amount !== expense.amount ? (
                              <>
                                <span className="text-gray-500 line-through text-xs">
                                  Total: ${expense.original_amount}
                                </span>
                                <span className="font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
                                  Tu parte: ${expense.amount}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-gray-800 text-base">
                                A pagar: ${expense.amount}
                              </span>
                            )}
                          </div>

                          {expense.receipt_url && (
                            <a 
                              href={expense.receipt_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-700 hover:underline flex items-center gap-1 mt-2 bg-blue-50 w-fit px-2 py-1 rounded hover:bg-blue-100"
                            >
                              📎 Ver recibo
                            </a>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-500 whitespace-nowrap ml-2">{formatDate(expense.created_at)}</p>
                      </div>

                      <div className="flex justify-end mt-3">
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

            {/* --- SECCIÓN 2: COBROS (QUIÉN TE DEBE) --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-xl mb-4 text-gray-900 flex items-center gap-2">
                💰 Te deben a ti
              </h2>

              {receivables?.length === 0 ? (
                <p className="text-gray-600 text-sm italic">No has creado cobros pendientes.</p>
              ) : (
                <div className="space-y-4">
                  {receivables?.map((expense) => (
                    <div key={expense.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             {/* @ts-ignore */}
                            {expense.groups && (
                              <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                👥 {/* @ts-ignore */} {expense.groups.name}
                              </span>
                            )}
                            <p className="font-medium text-gray-900 text-lg">{expense.description}</p>
                          </div>

                          {/* QUIÉN TE DEBE (Usando el mapa por email) */}
                          <p className="text-sm text-gray-700 mb-2">
                            Te debe: <strong className="text-indigo-700">{getUserNameByEmail(expense.debtor_email)}</strong>
                          </p>
                          
                           <div className="flex flex-wrap gap-2 text-sm items-center">
                            {expense.original_amount && expense.original_amount !== expense.amount ? (
                              <>
                                <span className="text-gray-500 line-through text-xs">
                                  Total: ${expense.original_amount}
                                </span>
                                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                  Te debe: ${expense.amount}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-gray-800 text-base">
                                Monto: ${expense.amount}
                              </span>
                            )}
                          </div>

                          {expense.receipt_url && (
                            <a 
                              href={expense.receipt_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-700 hover:underline flex items-center gap-1 mt-2 bg-blue-50 w-fit px-2 py-1 rounded hover:bg-blue-100"
                            >
                              📎 Ver recibo
                            </a>
                          )}

                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <span className="text-xs font-medium text-gray-500">{formatDate(expense.created_at)}</span>
                           <ExpenseStatusButtons 
                              expenseId={expense.id} 
                              currentStatus={expense.status!} 
                              isDebtor={false} 
                            />
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