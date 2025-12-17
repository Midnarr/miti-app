"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";

// FUNCIÓN AUXILIAR: Extrae el nombre del archivo de la URL completa
// Convierte: https://xyz.supabase.co/.../public/avatars/mi-foto.jpg
// En: mi-foto.jpg
const extractFilePath = (url: string) => {
    const parts = url.split('/avatars/');
    if (parts.length > 1) {
        return parts[1];
    }
    return null;
};

export default function AvatarUpload({ 
  uid, 
  url, 
  size = 150 
}: { 
  uid: string; 
  url: string | null; 
  size?: number;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (url) setAvatarUrl(url);
  }, [url]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Debes seleccionar una imagen.");
      }

      // --- PASO 1: INTENTAR BORRAR LA FOTO VIEJA ---
      // Si ya existe una URL actual, intentamos extraer el nombre y borrarla
      if (avatarUrl) {
          const oldFilePath = extractFilePath(avatarUrl);
          if (oldFilePath) {
              console.log("Intentando borrar foto vieja:", oldFilePath);
              // No nos importa mucho si da error al borrar (quizás ya no existía), 
              // así que no lanzamos el error con 'throw'.
              await supabase.storage.from("avatars").remove([oldFilePath]);
          }
      }

      // --- PASO 2: PREPARAR EL NUEVO ARCHIVO ---
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      // Usamos un timestamp para asegurar que el nombre siempre sea único
      const fileName = `${uid}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // --- PASO 3: SUBIR A SUPABASE STORAGE ---
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true }); // upsert ayuda a sobrescribir si hiciera falta

      if (uploadError) throw uploadError;

      // --- PASO 4: OBTENER URL PÚBLICA ---
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // --- PASO 5: GUARDAR URL EN LA TABLA PROFILES ---
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", uid);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      router.refresh();
      alert("¡Foto actualizada!");

    } catch (error: any) {
      alert("Error subiendo foto: " + error.message);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="relative rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 group"
        style={{ width: size, height: size }}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Avatar"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full text-gray-400 text-4xl font-bold bg-indigo-50">
            Letra
          </div>
        )}
        
        {/* Overlay de carga */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <div className="relative">
        <label 
          htmlFor="single" 
          className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-full text-sm font-bold transition-colors shadow-sm active:scale-95 inline-block"
        >
          {uploading ? "Subiendo..." : "Cambiar Foto"}
        </label>
        <input
          style={{ visibility: "hidden", position: "absolute" }}
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </div>
    </div>
  );
}