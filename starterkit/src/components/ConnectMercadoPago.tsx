"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 👇 IMPORTANTE: Asegúrate de tener estas variables en tu .env.local
// O puedes volver a poner tus credenciales "hardcodeadas" aquí si lo prefieres por ahora.
const APP_ID = process.env.NEXT_PUBLIC_MP_APP_ID || "2174862485117323"; 
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/mp/callback`;

export default function ConnectMercadoPago({ isConnected }: { isConnected: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // URL para conectar (Login de MP)
  const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${APP_ID}&response_type=code&platform_id=mp&state=random_id&redirect_uri=${REDIRECT_URI}`;

  // Función para DESCONECTAR
  const handleUnlink = async () => {
    if (!confirm("¿Seguro que quieres desconectar tu cuenta? Dejarás de recibir pagos.")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/mp/unlink", { method: "POST" });
      if (res.ok) {
        router.refresh(); // Recarga la página para actualizar el estado
      } else {
        alert("Hubo un error al desconectar.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 border rounded-xl shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg mb-1">Mercado Pago</h3>
          <p className="text-gray-500 text-sm mb-4">
            {isConnected 
              ? "✅ Tu cuenta está conectada y lista para recibir dinero." 
              : "Conecta tu cuenta para que tus amigos te paguen directo."}
          </p>
        </div>
        {isConnected && <span className="text-2xl">🤝</span>}
      </div>

      {isConnected ? (
        // ESTADO: CONECTADO (Mostrar botón rojo de desconectar)
        <button
          onClick={handleUnlink}
          disabled={loading}
          className="w-full border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
        >
          {loading ? "Desconectando..." : "Desvincular Cuenta"}
        </button>
      ) : (
        // ESTADO: DESCONECTADO (Mostrar botón azul de conectar)
        <Link
          href={authUrl}
          className="block w-full bg-[#009EE3] text-white text-center font-bold py-3 rounded-lg hover:bg-[#008ED6] transition-colors shadow-sm"
        >
          Conectar Mercado Pago
        </Link>
      )}
    </div>
  );
}