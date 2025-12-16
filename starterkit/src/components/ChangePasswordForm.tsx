"use client";

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";

export default function ChangePasswordForm({ userEmail }: { userEmail: string }) {
  const supabase = createClient();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 1. Validaciones básicas
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "La nueva contraseña debe tener al menos 6 caracteres." });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas nuevas no coinciden." });
      setLoading(false);
      return;
    }

    try {
      // 2. VERIFICAR LA CONTRASEÑA ACTUAL
      // Intentamos iniciar sesión. Si falla, la contraseña actual es incorrecta.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("La contraseña actual es incorrecta.");
      }

      // 3. ACTUALIZAR A LA NUEVA CONTRASEÑA
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // 4. Éxito
      setMessage({ type: "success", text: "¡Contraseña actualizada correctamente!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Ocurrió un error al actualizar." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 border rounded-xl shadow-sm mt-8">
      <h3 className="font-bold text-lg mb-4 text-gray-800">🔒 Cambiar Contraseña</h3>

      {message && (
        <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${
          message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="••••••••"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Repite la nueva"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Actualizando..." : "Actualizar Contraseña"}
        </button>
      </form>
    </div>
  );
}