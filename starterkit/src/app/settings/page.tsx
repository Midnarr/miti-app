import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import ConnectMercadoPago from "@/components/ConnectMercadoPago";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Consultar si tiene el token de MP
  const { data: profile } = await supabase
    .from("profiles")
    .select("mp_access_token")
    .eq("id", user.id)
    .single();

  // Convertimos a booleano (true si existe texto, false si es null)
  const isConnected = !!profile?.mp_access_token;

  // Mensajes de éxito/error (opcional, por si vuelves del callback)
  const success = searchParams?.success;
  const error = searchParams?.error;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Configuración</h1>

      {/* Mensajes de feedback */}
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

      <div className="space-y-6">
        {/* 👇 Aquí pasamos el estado real */}
        <ConnectMercadoPago isConnected={isConnected} />
        
        {/* Aquí puedes poner más configuraciones (cambiar nombre, etc) */}
      </div>
    </div>
  );
}