import { createClient } from "@/libs/supabase/server";
import { notFound, redirect } from "next/navigation";
import CreateGroupExpenseForm from "@/components/CreateGroupExpenseForm";
import ExpenseStatusButtons from "@/components/ExpenseStatusButtons";

// Definimos la interfaz para el tipo de datos que viene de Supabase
type Expense = {
  id: string;
  description: string;
  amount: number;
  original_amount: number | null;
  created_at: string;
  status: string; // 'pending' | 'paid'
  payer_id: string;
  debtor_email: string;
  receipt_url: string | null;
  profiles?: { username: string; email: string } | null; // Join opcional
};

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

  // 3. Obtener GASTOS del grupo (con datos del pagador)
  // Nota: Hacemos un join manual simple o asumimos emails
  const { data: expensesData } = await supabase
    .from("expenses")
    .select(`
      *,
      profiles:payer_id (username, email) 
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  // Forzamos el tipado
  const expenses = expensesData as unknown as Expense[];

  // Helpers de formato
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: '2-digit', month: 'short'
    });
  };

  // Helper para mostrar nombres bonitos
  const getPayerName = (expense: Expense) => {
    if (expense.payer_id === user.id) return "Tú";
    // @ts-ignore
    return expense.profiles?.username || expense.profiles?.email || "Alguien";
  };

  const getDebtorName = (email: string) => {
    if (email === user.email) return "Ti";
    return email.split('@')[0]; // Muestra "juan" de "juan@gmail.com"
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* CABECERA DEL GRUPO */}
      <div className="bg-white p-6 rounded-xl shadow border border-indigo-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            👥 {group.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {members?.length} miembros en este grupo
          </p>
        </div>
        <span className="text-2xl">💸</span>
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

        {/* COLUMNA DERECHA: HISTORIAL ESTILO DASHBOARD */}
        <div className="md:col-span-2">
          <h2 className="font-bold text-xl mb-4 text-gray-800">Historial de Gastos</h2>
          
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            {expenses?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay gastos registrados en este grupo aún.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {expenses?.map((expense) => {
                  const isMePayer = expense.payer_id === user.id;
                  const isMeDebtor = expense.debtor_email === user.email;
                  
                  // Definimos colores según si debo o me deben
                  // Si soy el deudor -> Naranja (Deuda)
                  // Si soy el pagador -> Indigo (Me deben)
                  // Si no soy ninguno (solo espectador) -> Gris
                  let borderClass = "border-l-4 border-gray-200"; // Espectador
                  if (isMeDebtor && expense.status === 'pending') borderClass = "border-l-4 border-orange-400";
                  if (isMePayer && expense.status === 'pending') borderClass = "border-l-4 border-indigo-500";
                  if (expense.status === 'paid') borderClass = "border-l-4 border-green-400"; // Pagado

                  return (
                    <div key={expense.id} className={`p-4 ${borderClass} hover:bg-gray-50 transition-colors`}>
                      <div className="flex justify-between items-start">
                        
                        {/* INFO IZQUIERDA */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
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
                            <span className="font-medium text-indigo-700">{getPayerName(expense)}</span> pagó por{" "}
                            <span className="font-medium text-orange-700">{getDebtorName(expense.debtor_email)}</span>
                          </p>

                          {/* LÓGICA DE PRECIOS (IGUAL AL DASHBOARD) */}
                          <div className="flex flex-wrap gap-2 text-sm items-center">
                            {expense.original_amount && expense.original_amount !== expense.amount ? (
                              <>
                                {/* Precio Original tachado */}
                                <span className="text-gray-400 line-through text-xs">
                                  Total: ${expense.original_amount}
                                </span>
                                {/* Tu Parte / Su Parte */}
                                <span className={`font-bold px-2 py-0.5 rounded border ${
                                  isMeDebtor 
                                    ? "text-orange-700 bg-orange-50 border-orange-100" 
                                    : "text-indigo-700 bg-indigo-50 border-indigo-100"
                                }`}>
                                  {isMeDebtor ? "Tu parte" : "Su parte"}: ${expense.amount}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-gray-800">
                                Monto: ${expense.amount}
                              </span>
                            )}
                          </div>

                          {/* RECIBO */}
                          {expense.receipt_url && (
                            <a 
                              href={expense.receipt_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1 mt-2 w-fit"
                            >
                              📎 Ver recibo
                            </a>
                          )}
                        </div>

                        {/* ACCIONES DERECHA */}
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <span className="text-xs text-gray-400 font-medium">
                            {formatDate(expense.created_at)}
                          </span>
                          
                          {/* Solo mostramos botones si soy parte de la transacción */}
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