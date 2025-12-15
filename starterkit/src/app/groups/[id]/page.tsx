import { createClient } from "@/libs/supabase/server";
import { notFound, redirect } from "next/navigation";
import CreateGroupExpenseForm from "@/components/CreateGroupExpenseForm";
import ExpenseStatusButtons from "@/components/ExpenseStatusButtons";

// Definimos la interfaz flexible para evitar errores de tipo
interface Expense {
  id: string;
  description: string;
  amount: number;
  original_amount: number | null;
  created_at: string;
  status: string;
  payer_id: string;
  debtor_email: string;
  receipt_url: string | null;
  // Hacemos profiles opcional y un array por si Supabase devuelve varios
  profiles?: { username: string; email: string } | { username: string; email: string }[] | null;
}

export default async function GroupDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const groupId = params.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Obtener datos del GRUPO
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (!group) return notFound();

  // 2. Obtener MIEMBROS
  const { data: members } = await supabase
    .from("group_members")
    .select("member_email")
    .eq("group_id", groupId);

  // 3. Obtener GASTOS (Query segura)
  // Intentamos traer perfiles. Si falla la relación en tu DB, al menos traerá el gasto.
  const { data: expensesData, error: expensesError } = await supabase
    .from("expenses")
    .select(`
      *,
      profiles (username, email)
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (expensesError) {
    console.error("Error cargando gastos:", expensesError);
  }

  // Convertimos a nuestro tipo
  const expenses = (expensesData || []) as unknown as Expense[];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: '2-digit', month: 'short'
    });
  };

  // Helper seguro para obtener nombre
  const getPayerName = (expense: Expense) => {
    if (expense.payer_id === user.id) return "Tú";
    
    // Manejo robusto de la respuesta de Supabase (puede ser objeto o array)
    const profile = Array.isArray(expense.profiles) ? expense.profiles[0] : expense.profiles;
    
    if (profile) {
      return profile.username || profile.email;
    }
    return "Un miembro";
  };

  const getDebtorName = (email: string) => {
    if (email === user.email) return "Ti";
    return email.split('@')[0];
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      {/* CABECERA DEL GRUPO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            👥 {group.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {members?.length || 0} miembros en este grupo
          </p>
        </div>
        <div className="bg-indigo-50 p-3 rounded-full">
          <span className="text-2xl">💸</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="md:col-span-1">
          <CreateGroupExpenseForm 
            groupId={groupId} 
            members={members?.map(m => m.member_email) || []}
            currentUserEmail={user.email!}
          />
        </div>

        {/* COLUMNA DERECHA: HISTORIAL */}
        <div className="md:col-span-2">
          <h2 className="font-bold text-xl mb-4 text-gray-900">Historial de Gastos</h2>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No hay gastos registrados en este grupo aún.</p>
                <p className="text-xs mt-2 text-gray-400">Usa el formulario de la izquierda para agregar uno.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {expenses.map((expense) => {
                  const isMePayer = expense.payer_id === user.id;
                  const isMeDebtor = expense.debtor_email === user.email;
                  
                  // Lógica de colores y bordes
                  let borderClass = "border-l-4 border-gray-200"; // Espectador
                  if (isMeDebtor && expense.status === 'pending') borderClass = "border-l-4 border-orange-400";
                  if (isMePayer && expense.status === 'pending') borderClass = "border-l-4 border-indigo-500";
                  if (expense.status === 'paid') borderClass = "border-l-4 border-green-400";

                  return (
                    <div key={expense.id} className={`p-4 ${borderClass} hover:bg-gray-50 transition-colors`}>
                      <div className="flex justify-between items-start gap-3">
                        
                        {/* INFO IZQUIERDA */}
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <span className="font-bold text-gray-900 text-lg">
                              {expense.description}
                            </span>
                            {expense.status === 'paid' && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">
                                Pagado
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-semibold text-indigo-700">{getPayerName(expense)}</span> pagó por{" "}
                            <span className="font-semibold text-orange-700">{getDebtorName(expense.debtor_email)}</span>
                          </p>

                          {/* LÓGICA DE PRECIOS */}
                          <div className="flex flex-wrap gap-2 text-sm items-center">
                            {expense.original_amount && expense.original_amount !== expense.amount ? (
                              <>
                                <span className="text-gray-400 line-through text-xs">
                                  Total: ${expense.original_amount}
                                </span>
                                <span className={`font-bold px-2 py-0.5 rounded border ${
                                  isMeDebtor 
                                    ? "text-orange-700 bg-orange-50 border-orange-100" 
                                    : "text-indigo-700 bg-indigo-50 border-indigo-100"
                                }`}>
                                  {isMeDebtor ? "Tu parte" : "Su parte"}: ${expense.amount}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                                Monto: ${expense.amount}
                              </span>
                            )}
                          </div>

                          {/* ENLACE RECIBO */}
                          {expense.receipt_url && (
                            <a 
                              href={expense.receipt_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1 mt-2 w-fit bg-blue-50 px-2 py-1 rounded"
                            >
                              📎 Ver recibo
                            </a>
                          )}
                        </div>

                        {/* ACCIONES DERECHA */}
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                            {formatDate(expense.created_at)}
                          </span>
                          
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
    </div>
  );
}