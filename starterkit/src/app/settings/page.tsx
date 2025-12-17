import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import ConnectMercadoPago from "@/components/ConnectMercadoPago";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import PaymentMethodsSettings from "@/components/PaymentMethodsSettings";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Consultar estado de Mercado Pago (token)
  const { data: profile } = await supabase
    .from("profiles")
    .select("mp_access_token")
    .eq("id", user.id)
    .single();

  const isConnected = !!profile?.mp_access_token;

  // 2. Consultar Métodos de Pago Guardados (Alias/CBU)
  const { data: savedMethods } = await supabase
    .from("user_payment_methods")
    .select("*")
    .eq("user_id", user.id);

  const success = searchParams?.success;
  const error = searchParams?.error;

  return (
    <div className="max-w-2xl mx-auto p-8 pb-20">
      <h1 className="text-3xl font-bold mb-8">Configuración</h1>

      {/* Mensajes de Feedback Globales */}
      {success === "mp_connected" && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 border border-green-200">
          ✅ ¡Tu cuenta de Mercado Pago se conectó correctamente!
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
          ❌ Hubo un error. Inténtalo de nuevo.
        </div>
      )}

      <div className="space-y-10">
        
        {/* SECCIÓN 1: MERCADO PAGO AUTOMÁTICO */}
        <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Conexión Mercado Pago (Checkout)</h2>
            <ConnectMercadoPago isConnected={isConnected} />
        </section>

        {/* SECCIÓN 2: CUENTAS PARA TRANSFERENCIA (ALIAS/CBU) */}
        <section>
            <PaymentMethodsSettings initialMethods={savedMethods || []} />
        </section>

        {/* SECCIÓN 3: SEGURIDAD */}
        <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Seguridad</h2>
            <ChangePasswordForm userEmail={user.email!} />
        </section>

      </div>
    </div>
  );
}