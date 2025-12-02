import React, { useMemo, useState } from "react";

const STORAGE_KEY = "reservas-padel-v1";

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

export default function Profile() {
  const store = load();
  const reservas = Array.isArray(store.reservas) ? store.reservas : [];
  const [term, setTerm] = useState("");

  const mine = useMemo(()=>{
    const t = term.trim().toLowerCase();
    if (!t) return [];
    return reservas
      .filter(r => [r.name, r.phone, r.email].join(" ").toLowerCase().includes(t))
      .sort((a,b)=> (a.date+b.start).localeCompare(b.date+b.start));
  }, [reservas, term]);

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-3">Mi historial de reservas</h1>
        <p className="text-white/70 mb-4 text-sm">Buscá por tu nombre, teléfono o email.</p>

        <input
          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10"
          placeholder="Ej: Juan Perez o 11 5555"
          value={term}
          onChange={e=>setTerm(e.target.value)}
        />

        <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-white/70 border-b border-white/10">
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Hora</th>
                <th className="py-2 pr-4">Cancha</th>
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {mine.length===0 && <tr><td className="py-6 text-white/60" colSpan={5}>Sin resultados.</td></tr>}
              {mine.map(r=>(
                <tr key={r.id} className="border-t border-white/10">
                  <td className="py-2 pr-4">{r.date}</td>
                  <td className="py-2 pr-4">{r.start}–{r.end}</td>
                  <td className="py-2 pr-4">{r.court}</td>
                  <td className="py-2 pr-4">{r.name}</td>
                  <td className="py-2 pr-4">{r.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-white/50 mt-3">* Datos almacenados localmente mientras no conectemos base de datos.</p>
      </div>
    </div>
  );
}
