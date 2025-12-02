import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ChartsDashboard from "./components/ChartsDashboard";


// Debe coincidir con el usado en tu App.js
const STORAGE_KEY = "reservas-padel-v1";

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function minutes(t) { const [h,m] = t.split(":").map(Number); return h*60+m; }

export default function Admin() {
  // carga inicial desde localStorage (reservas + config)
  const [store, setStore] = useState(() => loadStore());
  const [date, setDate] = useState(() => {
    const d = new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
    return d.toISOString().slice(0,10);
  });
  const [search, setSearch] = useState("");
  const [court, setCourt] = useState("all");
  const [paid, setPaid] = useState("all");
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");

  // refrescar cuando vuelvo a la pestaña o cambia localStorage
  useEffect(() => {
    const onFocus = () => setStore(loadStore());
    const onStorage = () => setStore(loadStore());
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener("focus", onFocus); window.removeEventListener("storage", onStorage); };
  }, []);

  const config = store.config || { complexName: "COMPLEJO 655", adminPIN: "1234", courts: 4 };
  const reservas = Array.isArray(store.reservas) ? store.reservas : [];

  // gate simple por PIN
  function checkPin() {
    if (pin === (config.adminPIN || "1234")) {
      setUnlocked(true);
    } else {
      window.alert("PIN incorrecto");
    }
  }

  // helpers de acciones
  function togglePaid(id) {
    const next = reservas.map(r => r.id===id ? { ...r, paid: !r.paid } : r);
    const newStore = { ...store, reservas: next };
    setStore(newStore); saveStore(newStore);
  }
  function removeReserva(id) {
    if (!window.confirm("¿Eliminar reserva?")) return;
    const next = reservas.filter(r => r.id !== id);
    const newStore = { ...store, reservas: next };
    setStore(newStore); saveStore(newStore);
  }
  function exportCSV() {
    const headers = ["fecha","cancha","inicio","fin","nombre","telefono","email","pagado","notas"];
    const lines = reservas.map(r => [
      r.date, r.court, r.start, r.end, r.name, r.phone, r.email, r.paid?"si":"no", r.notes||""
    ].map(v => `"${(v??"").toString().replaceAll('"','""')}"`).join(","));
    const blob = new Blob([[headers.join(",")].concat("\n").concat(lines.join("\n"))], { type:"text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "reservas.csv";
    a.click(); URL.revokeObjectURL(a.href);
  }

  // filtros
  const view = useMemo(() => {
    return reservas
      .filter(r => r.date === date)
      .filter(r => court==="all" ? true : String(r.court)===String(court))
      .filter(r => paid==="all" ? true : (paid==="yes" ? r.paid : !r.paid))
      .filter(r => {
        const t = search.trim().toLowerCase();
        if (!t) return true;
        return [r.name, r.phone, r.email, r.start, r.end, `c${r.court}`].join(" ").toLowerCase().includes(t);
      })
      .sort((a,b) => a.court-b.court || minutes(a.start)-minutes(b.start));
  }, [reservas, date, search, court, paid]);

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-osaka-dark text-white">
        <header className="bg-osaka-dark/80 border-b border-white/10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/osaka-logo.png" alt="OSAKA" className="w-8 h-8 rounded"/>
              <h1 className="text-xl font-semibold">{config.complexName || "OSAKA PADEL"} — Admin</h1>
            </div>
            <Link to="/" className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20">Inicio</Link>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Ingresar al panel</h2>
            <p className="text-white/70 text-sm mb-4">PIN de administrador (demo: 1234 o el que configuraste).</p>
            <div className="flex gap-2">
              <input
                className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 flex-1"
                placeholder="PIN"
                value={pin}
                onChange={e=>setPin(e.target.value)}
              />
              <button onClick={checkPin} className="px-4 py-2 rounded-xl bg-osaka-green text-black font-medium hover:opacity-90">Entrar</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-osaka-dark text-white">
      <header className="bg-osaka-dark/80 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/osaka-logo.png" alt="OSAKA" className="w-8 h-8 rounded"/>
            <h1 className="text-xl font-semibold">{config.complexName || "OSAKA PADEL"} — Panel de reservas</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/reservar" className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20">Reservar</Link>
            <Link to="/" className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20">Inicio</Link>
            <button onClick={exportCSV} className="px-3 py-1.5 rounded-xl bg-osaka-green text-black font-medium hover:opacity-90">Exportar CSV</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Filtros */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="grid sm:grid-cols-4 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-white/70 text-sm">Fecha</span>
              <input type="date" className="px-3 py-2 rounded-xl bg-black/40 border border-white/10" value={date} onChange={e=>setDate(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-white/70 text-sm">Cancha</span>
              <select className="px-3 py-2 rounded-xl bg-black/40 border border-white/10" value={court} onChange={e=>setCourt(e.target.value)}>
                <option value="all">Todas</option>
                {Array.from({length: config.courts || 4}, (_,i)=>i+1).map(c=> <option key={c} value={c}>Cancha {c}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-white/70 text-sm">Pago</span>
              <select className="px-3 py-2 rounded-xl bg-black/40 border border-white/10" value={paid} onChange={e=>setPaid(e.target.value)}>
                <option value="all">Todos</option>
                <option value="yes">Pagados</option>
                <option value="no">Pendientes</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-white/70 text-sm">Buscar</span>
              <input className="px-3 py-2 rounded-xl bg-black/40 border border-white/10" placeholder="Nombre, teléfono, hora..." value={search} onChange={e=>setSearch(e.target.value)} />
            </label>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-white/70 border-b border-white/10">
                <th className="py-2 pr-4">Hora</th>
                <th className="py-2 pr-4">Cancha</th>
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Teléfono</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Pagado</th>
                <th className="py-2 pr-4">Notas</th>
                <th className="py-2 pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {view.length === 0 && (
                <tr><td className="py-6 text-white/60" colSpan={8}>No hay reservas para esta vista.</td></tr>
              )}
              {view.map(r => (
                <tr key={r.id} className="border-t border-white/10 hover:bg-white/5 align-top">
                  <td className="py-2 pr-4 whitespace-nowrap">{r.start}–{r.end}</td>
                  <td className="py-2 pr-4">Cancha {r.court}</td>
                  <td className="py-2 pr-4">{r.name}</td>
                  <td className="py-2 pr-4">
                    {r.phone}
                    {r.phone && (
                      <a className="ml-2 underline text-osaka-green" target="_blank" rel="noreferrer"
                         href={`https://wa.me/${(r.phone||'').replace(/[^\\d]/g,'')}?text=${encodeURIComponent(`Hola ${r.name}! Te recordamos tu reserva ${r.date} ${r.start}-${r.end} (Cancha ${r.court}) en ${config.complexName||'OSAKA PADEL'}.`)}`}>
                        WhatsApp
                      </a>
                    )}
                  </td>
                  <td className="py-2 pr-4">{r.email}</td>
                  <td className="py-2 pr-4">{r.paid ? "Sí" : "No"}</td>
                  <td className="py-2 pr-4 max-w-[240px]">{r.notes}</td>
                  <td className="py-2 pr-4 space-x-2 whitespace-nowrap">
                    <button onClick={()=>togglePaid(r.id)} className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20">Pago</button>
                    <button onClick={()=>removeReserva(r.id)} className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
