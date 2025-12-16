import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto p-6 md:p-12 space-y-6 text-gray-700">
      <div className="mb-8">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">← Volver al inicio</Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Política de Privacidad</h1>
        <p className="text-sm text-gray-500">Última actualización: {new Date().toLocaleDateString()}</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">1. Información que recopilamos</h2>
        <p>
          Para que Miti funcione correctamente, recopilamos la siguiente información:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Datos de Identificación:</strong> Nombre de usuario, dirección de correo electrónico y foto de perfil (a través de proveedores de autenticación como Google).</li>
          <li><strong>Datos de Transacciones:</strong> Detalles de los gastos compartidos (descripción, monto, fecha) y los grupos a los que perteneces.</li>
          <li><strong>Datos de Integración de Pagos:</strong> Si decides conectar tu cuenta de Mercado Pago, almacenamos de forma segura tus credenciales de acceso (Tokens OAuth) para facilitar los cobros.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">2. Uso de la información</h2>
        <p>Utilizamos tus datos para:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Crear y gestionar tu cuenta.</li>
          <li>Calcular divisiones de gastos y saldos entre amigos.</li>
          <li>Permitir que otros usuarios te paguen directamente a través de Mercado Pago.</li>
          <li>Enviarte notificaciones sobre nuevos gastos o pagos pendientes.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">3. Integración con Mercado Pago</h2>
        <p>
          Miti utiliza los servicios de <strong>Mercado Pago</strong> como procesador de pagos externo. Al conectar tu cuenta:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Miti <strong>NO</strong> almacena ni tiene acceso a tu información bancaria sensible (números de tarjeta de crédito, CBU, CVU). Esa información es gestionada exclusivamente por Mercado Pago.</li>
          <li>Compartimos información limitada de la transacción (monto y concepto del gasto) con Mercado Pago para generar los enlaces de pago.</li>
          <li>Puedes revocar el acceso (desvincular tu cuenta) en cualquier momento desde la sección de Configuración de Miti. Al hacerlo, eliminamos tus tokens de acceso de nuestra base de datos.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">4. Seguridad</h2>
        <p>
          Tomamos medidas razonables para proteger tu información. Utilizamos conexiones seguras (SSL/HTTPS) y bases de datos con cifrado y políticas de seguridad (Row Level Security) para asegurar que solo tú y tus amigos autorizados vean sus gastos compartidos.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">5. Contacto</h2>
        <p>
          Si tienes preguntas sobre esta política, puedes contactarnos a través del soporte de la aplicación.
        </p>
      </section>
    </main>
  );
}