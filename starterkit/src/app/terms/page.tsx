import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto p-6 md:p-12 space-y-6 text-gray-700">
      <div className="mb-8">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">← Volver al inicio</Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Términos y Condiciones</h1>
        <p className="text-sm text-gray-500">Última actualización: {new Date().toLocaleDateString()}</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">1. Aceptación de los Términos</h2>
        <p>
          Al acceder y utilizar Miti ("la Aplicación"), aceptas cumplir con estos Términos y Condiciones. Si no estás de acuerdo, por favor no utilices la aplicación.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">2. Descripción del Servicio</h2>
        <p>
          Miti es una herramienta para registrar, dividir y realizar seguimiento de gastos compartidos entre usuarios. Miti actúa únicamente como una herramienta de registro y facilitación de información.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">3. Servicios de Pago (Mercado Pago)</h2>
        <p>
          Miti ofrece una integración con Mercado Pago para facilitar el saldo de deudas entre usuarios. Respecto a esta funcionalidad:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Intermediario Tecnológico:</strong> Miti solo genera los enlaces de pago basándose en la información provista por los usuarios. Miti <strong>NO</strong> es una entidad financiera, no retiene fondos, ni procesa pagos directamente.</li>
          <li><strong>Relación con Terceros:</strong> El procesamiento del pago está sujeto a los Términos y Condiciones de Mercado Pago. Cualquier problema con el procesamiento del pago (rechazos, contracargos, retenciones) debe ser resuelto directamente con Mercado Pago.</li>
          <li><strong>Comisiones:</strong> Mercado Pago podría aplicar comisiones por el uso de su plataforma. El usuario es responsable de revisar y asumir dichos costos si existieran.</li>
          <li><strong>Responsabilidad del Usuario:</strong> Es responsabilidad del usuario verificar que el destinatario del pago sea el correcto antes de confirmar la transacción en Mercado Pago.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">4. Limitación de Responsabilidad</h2>
        <p>
          Miti no garantiza que los cálculos de división de gastos sean libres de errores matemáticos o de lógica, aunque nos esforzamos por la precisión. Miti no se hace responsable por disputas personales o financieras entre los usuarios derivadas del uso de la aplicación.
        </p>
        <p>
          El uso de la función de marcar un gasto como "Pagado" o "Esperando Aprobación" es una herramienta de confianza entre usuarios y no constituye una prueba legal de pago certificada por Miti.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">5. Cuentas de Usuario</h2>
        <p>
          Eres responsable de mantener la seguridad de tu cuenta y de todas las actividades que ocurran bajo ella. Nos reservamos el derecho de suspender cuentas que violen estos términos o realicen actividades sospechosas.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">6. Modificaciones</h2>
        <p>
          Podemos actualizar estos términos en cualquier momento. Te notificaremos sobre cambios significativos a través de la aplicación o por correo electrónico.
        </p>
      </section>
    </main>
  );
}