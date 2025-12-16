import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
            ← Volver al inicio
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Términos y Condiciones de Uso</h1>
        <p className="text-gray-500 text-sm mb-8">Última actualización: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-indigo text-gray-700 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900">1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar <strong>Miti</strong> ("la Aplicación"), usted acepta cumplir y estar sujeto a estos términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">2. Descripción del Servicio</h2>
            <p>
              Miti es una herramienta diseñada para facilitar el cálculo y la división de gastos compartidos entre grupos de personas. <strong>Miti no es una entidad financiera ni procesa pagos.</strong> La aplicación actúa únicamente como una calculadora y registro de deudas. La liquidación real de las deudas es responsabilidad exclusiva de los usuarios fuera de la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">3. Cuentas de Usuario</h2>
            <p>
              Para utilizar ciertas funciones, debe registrarse creando una cuenta. Usted es responsable de mantener la confidencialidad de su cuenta y contraseña. Miti se reserva el derecho de cancelar cuentas que violen estos términos o realicen actividades sospechosas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">4. Contenido del Usuario</h2>
            <p>
              Nuestra aplicación permite subir imágenes (recibos/tickets) y textos. Usted conserva los derechos sobre el contenido que sube, pero otorga a Miti una licencia para almacenar y mostrar dicho contenido a los miembros de sus grupos con el fin de operar el servicio. Usted garantiza que el contenido subido no infringe leyes ni derechos de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">5. Limitación de Responsabilidad</h2>
            <p>
              Miti se proporciona "tal cual". No garantizamos que los cálculos estén libres de errores matemáticos o de software, aunque nos esforzamos por la precisión. Miti no se hace responsable de disputas financieras entre usuarios, impagos de deudas entre amigos, o malentendidos derivados del uso de la aplicación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">6. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado de la aplicación tras dichos cambios constituye su aceptación de los nuevos términos.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}