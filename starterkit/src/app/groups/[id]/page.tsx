import { createClient } from "@/libs/supabase/server";
import { notFound, redirect } from "next/navigation";
import CreateGroupExpenseForm from "@/components/CreateGroupExpenseForm";
import ExpenseStatusButtons from "@/components/ExpenseStatusButtons"; // Asegúrate de importar esto
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

  if (groupError || !group) {
    return notFound();
  }

  // 2. OBTENER MIEMBROS
  const { data: membersData } = await supabase
    .from("group_members")
    .select("member_email") 
    .eq("group_id", groupId);

  const memberEmails = membersData?.map(m => m.member_email) || [];

  // 3. OBTENER GASTOS
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
             <Link href="/dashboard/groups" className="text-gray-400 hover:text-indigo-600 transition-colors">
               ←
             </Link>
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
        
        {/* IZQUIERDA: FORMULARIO DE GASTOS */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <CreateGroupExpenseForm 
              groupId={groupId} 
              members={memberEmails}
              currentUserEmail={user.email!}
            />
          </div>
        </div>

        {/* DERECHA: LISTA DE GASTOS (Aquí está tu lógica nueva) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-xl text-gray-800">Historial</h2>
          
          {expenses?.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
              <p className="mb-2 text-4xl">💸</p>
              <p>No hay gastos registrados aún.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses?.map((expense) => {
                // --- TU LÓGICA COMIENZA AQUÍ ---
                const isMePayer = expense.payer_id === user.id;
                const isMeDebtor = expense.debtor_email === user.email;

                // Definimos el color del borde según el estado
                let borderColor = "border-gray-100";
                if (expense.status === 'proposed') borderColor = "border-indigo-200"; // Azulito para nuevos
                if (expense.status === 'pending') borderColor = "border-orange-200";  // Naranja para deuda confirmada
                if (expense.status === 'paid') borderColor = "border-green-200";      // Verde para pagado

                return (
                  <div key={expense.id} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${borderColor} flex justify-between items-center transition-all hover:shadow-md`}>
                    <div>
                      <p className="font-bold text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        {isMePayer ? "Le cobraste a:" : "Te cobró:"} <span className="font-medium text-indigo-600">{isMeDebtor ? "Ti" : expense.debtor_email}</span>
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <span className="block font-bold text-lg text-gray-800">${expense.amount}</span>
                      
                      {/* Pasamos todas las props necesarias al botón inteligente */}
                      <ExpenseStatusButtons 
                        expenseId={expense.id}
                        currentStatus={expense.status}
                        isDebtor={isMeDebtor}
                        isPayer={isMePayer}
                      />
                    </div>
                  </div>
                );
                // --- FIN DE TU LÓGICA ---
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}