import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ConnectMercadoPago from "@/components/ConnectMercadoPago";

export default async function SettingsPage(props: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Obtener parámetros de la URL para mostrar mensajes de éxito/error
  const searchParams = await props.searchParams;
  const success = searchParams?.success;
  const error = searchParams?.error;

  // Verificamos si ya tiene el token guardado
  const { data: profile } = await supabase
    .from("profiles")
    .select("mp_access_token")
    .eq("id", user.id)
    .single();

  const isConnected = !!profile?.mp_access_token;

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8">
      {/* Botón volver */}
      <Link href="/dashboard" className="inline-flex items-center text-gray-500 hover:text-indigo-600 mb-8 transition-colors text-sm font-medium">
        ← Volver al Dashboard
      </Link>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Configuración</h1>

      {/* Mensajes de feedback tras volver de Mercado Pago */}
      {success === "mp_connected" && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 border border-green-200 flex items-center gap-2">
          ✅ ¡Tu cuenta de Mercado Pago se conectó correctamente!
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200">
          ❌ Hubo un error al conectar Mercado Pago. Inténtalo de nuevo.
        </div>
      )}

      <div className="space-y-6">
        {/* TARJETA DE MERCADO PAGO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800">Métodos de Cobro</h3>
                {isConnected && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">Activo</span>}
            </div>
            
            {isConnected ? (
                <div className="text-gray-600 text-sm">
                    <p>✅ Ya has conectado tu cuenta.</p>
                    <p className="mt-1">Tus amigos ahora pueden pagarte directamente usando el botón "Pagar con MP".</p>
                </div>
            ) : (
                // 👈 AQUÍ USAMOS EL COMPONENTE QUE CREASTE
                <ConnectMercadoPago /> 
            )}
        </div>

        {/* Aquí podrías agregar más configuraciones en el futuro (cambiar nombre, avatar, etc) */}
      </div>
    </div>
  );
}