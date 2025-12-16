import Link from "next/link";

export default function ConnectMercadoPago() {
  const APP_ID = "2174862485117323"; 
  const REDIRECT_URI = "https://miti-app.vercel.app/api/mp/callback";
  
  const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${APP_ID}&response_type=code&platform_id=mp&state=random_id&redirect_uri=${REDIRECT_URI}`;

  return (
    <div className="bg-white p-6 border rounded-xl shadow-sm">
      <h3 className="font-bold text-lg mb-2">Recibir Pagos</h3>
      <p className="text-gray-500 text-sm mb-4">Conecta tu cuenta para que tus amigos te paguen directo.</p>
      <Link 
        href={authUrl}
        className="block w-full bg-[#009EE3] text-white text-center font-bold py-3 rounded-lg hover:bg-[#008ED6]"
      >
        Conectar Mercado Pago
      </Link>
    </div>
  );
}