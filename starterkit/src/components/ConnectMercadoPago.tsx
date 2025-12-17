"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Asegúrate de que estas variables coincidan con tu .env.local
const APP_ID = process.env.NEXT_PUBLIC_MP_APP_ID || "2174862485117323"; 
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/mp/callback`;

export default function ConnectMercadoPago({ isConnected }: { isConnected: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${APP_ID}&response_type=code&platform_id=mp&state=random_id&redirect_uri=${REDIRECT_URI}`;

  const handleUnlink = async () => {
    if (!confirm("¿Seguro que quieres desconectar tu cuenta? Dejarás de recibir pagos.")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/mp/unlink", { method: "POST" });
      if (res.ok) {
        router.refresh();
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
    <div className="bg-white p-6 border rounded-xl shadow-sm space-y-4">
      
      {/* Encabezado */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-gray-800">Mercado Pago</h3>
          <p className="text-gray-500 text-sm">
            {isConnected 
              ? "✅ Tu cuenta está conectada y lista para recibir dinero." 
              : "Conecta tu cuenta para que tus amigos te paguen directo."}
          </p>
        </div>
        {isConnected && <span className="text-2xl">🤝</span>}
      </div>

      {/* Botones de Acción */}
      {isConnected ? (
        <button
          onClick={handleUnlink}
          disabled={loading}
          className="w-full border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
        >
          {loading ? "Desconectando..." : "💔 Desvincular Cuenta"}
        </button>
      ) : (
        <Link
          href={authUrl}
          className="block w-full bg-[#009EE3] text-white text-center font-bold py-3 rounded-lg hover:bg-[#008ED6] transition-colors shadow-sm"
        >
          Conectar Mercado Pago
        </Link>
      )}

      {/* 👇 NOTA INFORMATIVA SOBRE COMISIONES (NUEVO) */}
      <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-3 items-start">
        <span className="text-lg">ℹ️</span>
        <p className="text-xs text-blue-800 leading-relaxed">
          <strong>Nota importante:</strong> Al recibir pagos a través de esta integración, 
          Mercado Pago podría retener una <strong>comisión por servicio</strong> sobre el monto total. 
          Miti solo facilita la conexión y no cobra comisiones adicionales.
        </p>
      </div>

    </div>
  );
}