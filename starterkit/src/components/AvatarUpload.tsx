"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${uid}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // 3. Guardar URL en la tabla profiles
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", uid);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      router.refresh(); // Recargar para que el Navbar se actualice también
      alert("¡Foto actualizada!");

    } catch (error: any) {
      alert("Error subiendo foto: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="relative rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100"
        style={{ width: size, height: size }}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Avatar"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full text-gray-400 text-4xl font-bold bg-indigo-50">
            User
          </div>
        )}
        
        {/* Overlay de carga */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <div className="relative">
        <label 
          htmlFor="single" 
          className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-full text-sm font-bold transition-colors shadow-sm active:scale-95 inline-block"
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