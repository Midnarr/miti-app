import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
            ← Volver al inicio
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidad</h1>
        <p className="text-gray-500 text-sm mb-8">Última actualización: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-indigo text-gray-700 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900">1. Información que Recopilamos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Información de Registro:</strong> Correo electrónico y contraseña (gestionados de forma segura a través de Supabase Auth).</li>
              <li><strong>Información del Perfil:</strong> Nombre de usuario (@username) y nombre visible.</li>
              <li><strong>Contenido Generado:</strong> Datos de grupos, descripciones de gastos, importes y fotografías de recibos/tickets que usted suba voluntariamente.</li>
              <li><strong>Relaciones:</strong> Información sobre quiénes son sus amigos dentro de la plataforma para facilitar la creación de grupos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">2. Uso de la Información</h2>
            <p>Utilizamos sus datos exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Proporcionar y mantener el servicio de división de gastos.</li>
              <li>Permitirle encontrar a otros usuarios y conectar con ellos.</li>
              <li>Almacenar sus comprobantes de gastos para referencia futura del grupo.</li>
              <li>Mejorar la funcionalidad y seguridad de la aplicación.</li>
            </ul>
            <p className="mt-2"><strong>No vendemos sus datos personales a terceros.</strong></p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">3. Almacenamiento de Datos</h2>
            <p>
              Sus datos son almacenados en servidores seguros proporcionados por <strong>Supabase</strong>. Las imágenes de los recibos se almacenan en buckets privados o públicos según la configuración del grupo, accesibles solo a través de la aplicación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">4. Sus Derechos</h2>
            <p>
              Usted tiene derecho a acceder, corregir o eliminar su información personal. Puede editar su perfil directamente en la aplicación. Si desea eliminar su cuenta y todos sus datos permanentemente, puede contactarnos o utilizar la función de borrado si está disponible en su configuración.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">5. Cookies</h2>
            <p>
              Utilizamos cookies esenciales para mantener su sesión iniciada y garantizar el funcionamiento seguro de la aplicación. No utilizamos cookies de rastreo publicitario de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">6. Contacto</h2>
            <p>
              Si tiene preguntas sobre esta política de privacidad, puede contactarnos a través del soporte de la aplicación.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}