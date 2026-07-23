"use client";

import { useEffect, useRef, useState } from "react";

type Peluquero = { id: number; nombre: string; foto_url: string | null; activo: boolean; orden: number };

export default function PeluquerosPage() {
  const [peluqueros, setPeluqueros] = useState<Peluquero[]>([]);
  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState<Peluquero | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const cargar = async () => {
    const r = await fetch("/api/admin/peluqueros");
    const d = await r.json();
    setPeluqueros(d.peluqueros || []);
  };

  useEffect(() => { cargar(); }, []);

  const elegirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setArchivo(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const resetForm = () => {
    setEditando(null);
    setNombre("");
    setArchivo(null);
    setPreview(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubiendo(true);

    let fotoUrl = editando?.foto_url ?? null;

    // Si hay archivo nuevo, subirlo (y borrar el anterior automáticamente)
    if (archivo) {
      const fd = new FormData();
      fd.append("file", archivo);
      if (fotoUrl) fd.append("old_url", fotoUrl);

      const r = await fetch("/api/admin/peluqueros/foto", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Error al subir la imagen."); setSubiendo(false); return; }
      fotoUrl = d.url;
    }

    const payload = { nombre, foto_url: fotoUrl };

    if (editando) {
      await fetch("/api/admin/peluqueros", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editando, ...payload }),
      });
    } else {
      const maxOrden = peluqueros.length > 0 ? Math.max(...peluqueros.map(p => p.orden)) : 0;
      await fetch("/api/admin/peluqueros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, orden: maxOrden + 1 }),
      });
    }

    setSubiendo(false);
    resetForm();
    cargar();
  };

  const toggleActivo = async (p: Peluquero) => {
    await fetch("/api/admin/peluqueros", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, activo: !p.activo }),
    });
    cargar();
  };

  const editar = (p: Peluquero) => {
    setEditando(p);
    setNombre(p.nombre);
    setArchivo(null);
    setPreview(p.foto_url);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const eliminar = async (p: Peluquero) => {
    if (!confirm(`¿Eliminar a "${p.nombre}"? Sus turnos asignados quedarán sin peluquero.`)) return;
    // Borrar foto del storage si tiene
    if (p.foto_url) {
      await fetch("/api/admin/peluqueros/foto", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: p.foto_url }),
      });
    }
    await fetch("/api/admin/peluqueros", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id }),
    });
    cargar();
  };

  const quitarFoto = async () => {
    setArchivo(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    // Si estamos editando y ya tiene foto guardada, la borramos del storage
    if (editando?.foto_url) {
      await fetch("/api/admin/peluqueros/foto", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: editando.foto_url }),
      });
      await fetch("/api/admin/peluqueros", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editando, foto_url: null }),
      });
      setEditando({ ...editando, foto_url: null });
      cargar();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Peluqueros</h1>
      <p className="text-sm text-gray-400 mb-6">Los clientes pueden elegir con quién atenderse.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-5">{editando ? "Editar peluquero" : "Agregar peluquero"}</h2>
          <form onSubmit={guardar} className="space-y-4">

            {/* Foto */}
            <div>
              {preview ? (
                <div className="relative w-24 h-24 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="preview" className="w-24 h-24 rounded-2xl object-cover border border-gray-200" />
                  <button
                    type="button"
                    onClick={quitarFoto}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                    title="Quitar foto"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors mb-3"
                >
                  <svg className="w-6 h-6 text-gray-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                  </svg>
                  <span className="text-[10px] text-gray-300 font-medium">Foto</span>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={elegirArchivo}
                className="hidden"
              />
              {!preview && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-800"
                >
                  Subir foto
                </button>
              )}
              <p className="text-[10px] text-gray-300 mt-1">JPG, PNG o WEBP · máx. 2 MB</p>
            </div>

            {/* Nombre */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Facundo"
                  required
                  className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={subiendo}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40"
              >
                {subiendo ? "Guardando..." : editando ? "Actualizar" : "Agregar"}
              </button>
              {editando && (
                <button type="button" onClick={resetForm}
                  className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {peluqueros.length === 0 && (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 text-sm">
              Sin peluqueros todavía.
            </div>
          )}
          {peluqueros.map(p => (
            <div key={p.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${p.activo ? "border-gray-200" : "border-gray-100 opacity-50"}`}>
              <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                {p.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="8" r="4"/><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-base ${p.activo ? "text-gray-900" : "text-gray-400 line-through"}`}>{p.nombre}</div>
                <div className="text-xs text-gray-400 mt-0.5">{p.activo ? "Activo" : "Inactivo"}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => editar(p)} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Editar
                </button>
                <button onClick={() => toggleActivo(p)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${p.activo ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                  {p.activo ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => eliminar(p)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
