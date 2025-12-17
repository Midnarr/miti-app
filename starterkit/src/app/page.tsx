import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-700 overflow-x-hidden">
      
      {/* --- NAVBAR (Solo botones, sin logo para no duplicar) --- */}
      <nav className="max-w-7xl mx-auto flex justify-end items-center p-6">
        <div className="flex gap-4 items-center">
          {/* Botón Iniciar Sesión: Ahora visible en móvil */}
          <Link 
            href="/login" 
            className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
          >
            Iniciar Sesión
          </Link>
          
          <Link 
            href="/login" // O /register
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-transform active:scale-95"
          >
            Registrarse
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-10 pb-32 px-4 text-center max-w-5xl mx-auto">
        
        {/* Decoración de fondo (Glow) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

        {/* LOGO CENTRAL (Movido aquí) */}
        <div className="mb-8 animate-in fade-in zoom-in duration-700">
           <span className="text-6xl md:text-8xl font-black tracking-tighter text-indigo-600">
             Miti.
           </span>
        </div>

        <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-6 border border-indigo-100">
          🚀 La nueva forma de dividir gastos
        </span>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Cuentas claras, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">
            amistades largas.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Olvídate de perseguir a tus amigos para que te paguen. 
          Gestiona grupos, divide tickets y sube comprobantes en segundos.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/login" 
            className="bg-indigo-600 text-white text-lg font-bold px-8 py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all hover:-translate-y-1"
          >
            Empezar Gratis
          </Link>
          <Link 
            href="#features" 
            className="bg-white text-gray-700 border border-gray-200 text-lg font-bold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Saber más
          </Link>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Todo lo que necesitas</h2>
            <p className="text-gray-500">Diseñado para viajes, cenas, compañeros de piso y parejas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl mb-6">
                🍕
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Grupos y Eventos</h3>
              <p className="text-gray-500 leading-relaxed">
                Crea grupos para viajes o cenas. Añade miembros y registra gastos compartidos al instante.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl mb-6">
                🧾
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sube tus Tickets</h3>
              <p className="text-gray-500 leading-relaxed">
                Adjunta fotos de los recibos para que no haya dudas. Transparencia total en cada cobro.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl mb-6">
                👥
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Red Social</h3>
              <p className="text-gray-500 leading-relaxed">
                Busca a tus amigos por @username, envíales solicitudes y dividan gastos fácilmente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white py-12 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <span className="text-xl font-extrabold text-gray-900">Miti</span>
            <p className="text-sm text-gray-500 mt-1">© 2025 Miti. Hecho con ❤️.</p>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-gray-400 hover:text-indigo-600 transition-colors">Privacidad</Link>
            <Link href="/terms" className="text-gray-400 hover:text-indigo-600 transition-colors">Términos</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}