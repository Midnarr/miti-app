import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { inviteMember } from "@/app/actions/groupActions";
import CreateGroupExpenseForm from "@/components/CreateGroupExpenseForm"; // <--- IMPORTAR
import ExpenseStatusButtons from "@/components/ExpenseStatusButtons"; // <--- Reusamos los botones de aprobar/rechazar

type Params = Promise<{ id: string }>;

export default async function GroupDetailPage(props: { params: Params }) {
  const params = await props.params;
  const groupId = params.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Datos del Grupo
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  // 2. Miembros
  const { data: members } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId);

  // 3. Gastos del Grupo
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (!group) return <div className="p-8">Grupo no encontrado (o sin permisos)</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabecera Simple */}
        <div className="flex items-center gap-4">
          <Link href="/groups" className="text-gray-500 hover:bg-gray-200 p-2 rounded-full transition">
            ←
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">{group.name}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA (3/12): Miembros e Invitaciones */}
          <div className="md:col-span-3 space-y-6">
            <div className="bg-white p-5 rounded-xl shadow border">
              <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Miembros</h3>
              <ul className="space-y-3 mb-6">
                {members?.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200">
                      {m.user_email[0].toUpperCase()}
                    </div>
                    <span className="truncate" title={m.user_email}>{m.user_email}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 mb-2">INVITAR AMIGO</p>
                <form action={inviteMember} className="flex flex-col gap-2">
                  <input type="hidden" name="groupId" value={groupId} />
                  <input name="email" type="email" placeholder="email@amigo.com" className="border rounded px-3 py-2 text-sm w-full bg-gray-50" required />
                  <button className="bg-gray-800 text-white text-xs py-2 rounded hover:bg-black transition font-medium">Invitar</button>
                </form>
              </div>
            </div>
          </div>

          {/* COLUMNA CENTRAL (5/12): Lista de Gastos */}
          <div className="md:col-span-5">
            <div className="bg-white rounded-xl shadow border overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-700">Historial de Gastos</h3>
              </div>

              <div className="divide-y divide-gray-100">
                {expenses?.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <div className="text-4xl mb-2">💸</div>
                    <p className="text-gray-500 font-medium">No hay gastos aún</p>
                    <p className="text-sm text-gray-400">Usa el formulario para agregar el primero.</p>
                  </div>
                ) : (
                  expenses?.map((expense) => {
                    const isPayer = expense.payer_id === user.id;
                    const isDebtor = expense.debtor_email === user.email;

                    return (
                      <div key={expense.id} className="p-4 hover:bg-gray-50 transition flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-800">{expense.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {isPayer ? (
                                <span>Tú cobras a <strong className="text-gray-700">{expense.debtor_email}</strong></span>
                              ) : (
                                <span><strong className="text-gray-700">Alguien</strong> te cobra a ti</span>
                              )}
                            </p>
                            {expense.receipt_url && (
                              <a href={expense.receipt_url} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                                📎 Ver recibo
                              </a>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="block font-bold text-lg text-gray-800">${expense.amount}</span>
                            <span className="text-xs text-gray-400">{new Date(expense.date).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Botones de Acción (Reusamos el componente que ya creaste) */}
                        <div className="flex justify-end pt-2 border-t border-gray-100 border-dashed">
                           <ExpenseStatusButtons 
                              expenseId={expense.id}
                              currentStatus={expense.status!}
                              isDebtor={isDebtor} // Aquí la lógica detecta si te corresponde aprobar
                           />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA (4/12): Formulario de Crear */}
          <div className="md:col-span-4">
            <CreateGroupExpenseForm 
              groupId={groupId} 
              members={members || []} 
              currentUserEmail={user.email!}
            />
          </div>

        </div>
      </div>
    </div>
  );
}