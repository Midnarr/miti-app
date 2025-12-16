import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import ConnectMercadoPago from "@/components/ConnectMercadoPago";
// 👇 Importamos el nuevo componente
import ChangePasswordForm from "@/components/ChangePasswordForm"; 

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Consultar token de MP
  const { data: profile } = await supabase
    .from("profiles")
    .select("mp_access_token")
    .eq("id", user.id)
    .single();

  const isConnected = !!profile?.mp_access_token;
  const success = searchParams?.success;
  const error = searchParams?.error;

  return (
    <div className="max-w-2xl mx-auto p-8 pb-20"> {/* Agregué pb-20 para espacio al final */}
      <h1 className="text-3xl font-bold mb-8">Configuración</h1>

      {success === "mp_connected" && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 border border-green-200">
          ✅ ¡Tu cuenta de Mercado Pago se conectó correctamente!
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
          ❌ Hubo un error al conectar. Inténtalo de nuevo.
        </div>
      )}

      <div className="space-y-8">
        
        {/* SECCIÓN 1: MERCADO PAGO */}
        <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Métodos de Cobro</h2>
            <ConnectMercadoPago isConnected={isConnected} />
        </section>

        {/* SECCIÓN 2: SEGURIDAD (NUEVO) */}
        <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Seguridad</h2>
            <ChangePasswordForm userEmail={user.email!} />
        </section>

      </div>
    </div>
  );
}