import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ExpenseStatusButtons from "@/components/ExpenseStatusButtons";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. OBTENER GASTOS (Donde soy pagador O deudor)
  // Usamos el filtro "or" para traer todo lo que me involucre
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, groups(name)") // Traemos también el nombre del grupo si existe
    .or(`payer_id.eq.${user.id},debtor_email.eq.${user.email}`)
    .order("created_at", { ascending: false })
    .limit(20); // Mostramos los últimos 20 movimientos

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      
      {/* Bienvenida */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Hola, {user.email?.split("@")[0]} 👋</h1>
          <p className="text-gray-500 mt-1">Aquí tienes tus últimos movimientos.</p>
        </div>
        <Link href="/dashboard/groups" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm text-sm">
          Ver mis Grupos
        </Link>
      </div>

      {/* LISTA DE ACTIVIDAD RECIENTE */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="font-bold text-gray-800 text-xl mb-6 border-b pb-2">Actividad Reciente</h2>

        {!expenses || expenses.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">💤</p>
            <p>Todo tranquilo por aquí.</p>
            <p className="text-sm">No tienes deudas ni cobros pendientes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => {
              // --- LÓGICA INTELIGENTE (IGUAL QUE EN EL GRUPO) ---
              const isMePayer = expense.payer_id === user.id;
              const isMeDebtor = expense.debtor_email === user.email;

              // Color del borde según estado
              let borderColor = "border-gray-100";
              if (expense.status === 'proposed') borderColor = "border-indigo-200";
              if (expense.status === 'pending') borderColor = "border-orange-200";
              if (expense.status === 'paid') borderColor = "border-green-200";

              return (
                <div key={expense.id} className={`p-4 rounded-lg bg-gray-50 border-l-4 ${borderColor} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white hover:shadow-md transition-all`}>
                  
                  {/* Info del Gasto */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-lg">{expense.description}</span>
                      {/* Etiqueta del Grupo (si tiene) */}
                      {expense.groups && (expense.groups as any).name && (
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full uppercase font-bold">
                          {(expense.groups as any).name}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {isMePayer ? (
                        <>Le cobraste a <span className="font-bold text-indigo-600">{expense.debtor_email}</span></>
                      ) : (
                        <><span className="font-bold text-indigo-600">Alguien</span> te cobró</>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(expense.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Monto y Botones */}
                  <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                    <span className="font-bold text-xl text-gray-800">${expense.amount}</span>
                    
                    {/* Botones de Acción */}
                    <ExpenseStatusButtons 
                      expenseId={expense.id}
                      currentStatus={expense.status}
                      isDebtor={isMeDebtor}
                      isPayer={isMePayer}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}