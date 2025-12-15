import { createClient } from "@/libs/supabase/server";
import { notFound, redirect } from "next/navigation";
import CreateGroupExpenseForm from "@/components/CreateGroupExpenseForm";
import Link from "next/link";

export default async function GroupDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const groupId = params.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. OBTENER EL GRUPO (Protegido contra nulos)
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  // Si no existe el grupo o hay error, mostramos página 404 en vez de explotar
  if (groupError || !group) {
    return notFound();
  }

  // 2. OBTENER MIEMBROS
  // Usamos la tabla limpia "group_members" y la columna "member_email"
  const { data: membersData } = await supabase
    .from("group_members")
    .select("member_email") 
    .eq("group_id", groupId);

  // Convertimos la respuesta de base de datos en una lista simple de textos
  // Ejemplo: ["juan@gmail.com", "maria@hotmail.com"]
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
              members={memberEmails} // ✅ Pasamos array de strings simple
              currentUserEmail={user.email!}
            />
          </div>
        </div>

        {/* DERECHA: LISTA DE GASTOS */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-xl text-gray-800">Historial</h2>
          
          {expenses?.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
              <p className="mb-2 text-4xl">💸</p>
              <p>No hay gastos registrados aún.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses?.map((expense) => (
                <div key={expense.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{expense.description}</p>
                    <p className="text-sm text-gray-500">
                      Cobrado a: <span className="font-medium text-indigo-600">{expense.debtor_email}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-lg text-gray-800">${expense.amount}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${expense.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {expense.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}