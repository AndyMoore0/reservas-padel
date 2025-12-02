import React, { useEffect, useMemo, useState } from "react";

/* ========= Helpers ========= */
const DATE_FMT = (d) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);
const toTime = (s) => s.padStart(5, "0");
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// "HH:MM" -> minutos
const toMins = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
// minutos -> "HH:MM"
const fromMins = (mins) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

// solapamiento entre [aStart,aEnd] y [bStart,bEnd]
const overlap = (aStart, aEnd, bStart, bEnd) =>
  !(toMins(aEnd) <= toMins(bStart) || toMins(aStart) >= toMins(bEnd));

// genera slots del día con step minutos (90 fijo)
function buildSlots(open, close, step) {
  const out = [];
  let m = toMins(open);
  const end = toMins(close);
  while (m + step <= end) {
    out.push({ start: fromMins(m), end: fromMins(m + step) });
    m += step;
  }
  return out;
}

/* ========= Descarga ========= */
function downloadFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// .ics simple
function buildICS(reserva, complejoNombre = "Complejo 655") {
  const dtstart =
    reserva.date.replaceAll("-", "") +
    "T" +
    reserva.start.replace(":", "") +
    "00";
  const dtend =
    reserva.date.replaceAll("-", "") +
    "T" +
    reserva.end.replace(":", "") +
    "00";
  const uidCal = reserva.id + "@reservas-padel";
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Reservas Padel//ES
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${uidCal}
DTSTAMP:${dtstart}Z
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:Reserva Pádel – Cancha ${reserva.court}
DESCRIPTION:${reserva.name} ${reserva.phone ? "(" + reserva.phone + ")" : ""} – ${complejoNombre}
LOCATION:${complejoNombre}
END:VEVENT
END:VCALENDAR`;
}

/* ========= Storage ========= */
const STORAGE_KEY = "reservas-padel-v1";
function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ========= Config ========= */
const defaultConfig = {
  complexName: "Complejo 655",
  courts: 3,
  open: "08:00",
  close: "22:00",
  allowOverlap: false,
  requirePhone: true,
  adminPIN: "1234",
};

// --- Rango permitido de fechas (hoy hasta 7 días) ---
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const TODAY = DATE_FMT(new Date());
const MAX_DATE = DATE_FMT(addDays(new Date(), 7));
const isDateInRange = (ds) => ds >= TODAY && ds <= MAX_DATE;

// duración fija
const DURATION = 90;

// startAdmin: permite abrir la pantalla ya en modo admin (para /administrador)
export default function ReservasPadelApp({ startAdmin = false }) {
  // Estado base
  const [config, setConfig] = useState(() => ({
    ...defaultConfig,
    ...(loadData().config || {}),
  }));
  const [reservas, setReservas] = useState(() => loadData().reservas || []);

  // Wizard (1=fecha, 2=cancha, 3=hora, 4=datos)
  const [step, setStep] = useState(1);

  const [date, setDate] = useState(DATE_FMT(new Date()));
  const [court, setCourt] = useState(1);
  const [start, setStart] = useState(defaultConfig.open);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paid, setPaid] = useState(false);

  const [admin, setAdmin] = useState(startAdmin);
  const [pinInput, setPinInput] = useState("");
  const [search, setSearch] = useState("");

  // Admin: reserva/bloqueo rápido
  const [adminQuick, setAdminQuick] = useState({
    date: DATE_FMT(new Date()),
    court: 1,
    start: "",
    block: true,   // true = bloqueo sin nombre
    name: "",
    phone: "",
  });

  // slots del día (siempre 90m)
  const slots = useMemo(
    () => buildSlots(config.open, config.close, DURATION),
    [config.open, config.close]
  );

  // reservas del día
  const dayReservations = useMemo(
    () =>
      reservas
        .filter((r) => r.date === date)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [reservas, date]
  );

  // persistencia
  useEffect(() => {
    saveData({ config, reservas });
  }, [config, reservas]);

  // reservas de la cancha/fecha seleccionadas
  const takenForCourt = useMemo(
    () =>
      (Array.isArray(reservas) ? reservas : []).filter(
        (r) => r.date === date && String(r.court) === String(court)
      ),
    [reservas, date, court]
  );

  // si cambiás fecha/cancha y el start queda ocupado, limpiarlo
  useEffect(() => {
    if (!start) return;
    const stillFree = slots.some(
      ({ start: s, end: e }) =>
        s === start && !takenForCourt.some((r) => overlap(s, e, r.start, r.end))
    );
    if (!stillFree) setStart("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, court, reservas, config.open, config.close]);

  /* ---- Acciones ---- */
  function handleReservar() {
    if (!name.trim()) return alert("Ingresá el nombre del jugador");
    if (config.requirePhone && !phone.trim())
      return alert("Ingresá un teléfono de contacto");
    if (!isDateInRange(date)) {
      return alert(`Solo se pueden reservar turnos entre ${TODAY} y ${MAX_DATE}.`);
    }

    const sel = slots.find((s) => s.start === start);
    if (!sel) return alert("Seleccioná un horario válido");

    const newRes = {
      id: uid(),
      date,
      court: Number(court),
      start: sel.start,
      end: sel.end,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      paid,
      createdAt: Date.now(),
    };

    if (!config.allowOverlap) {
      const hasConflict = reservas.some(
        (r) =>
          r.date === newRes.date &&
          r.court === newRes.court &&
          overlap(newRes.start, newRes.end, r.start, r.end)
      );
      if (hasConflict)
        return alert(
          "Ese turno ya está ocupado en esa cancha. Probá otro horario o cancha."
        );
    }

    setReservas((prev) => [...prev, newRes]);


    // limpiar wizard
    setName("");
    setPhone("");
    setEmail("");
    setPaid(false);
    setStep(1);
  }

  // Admin: alta / bloqueo directo
  function adminQuickAdd() {
    const d = adminQuick.date || date;
    if (!isDateInRange(d)) {
      return alert(`Solo se pueden bloquear turnos entre ${TODAY} y ${MAX_DATE}.`);
    }
    const sel = slots.find((s) => s.start === adminQuick.start);
    if (!sel) return alert("Elegí un horario válido para el bloqueo/reserva.");

    const newRes = {
      id: uid(),
      date: d,
      court: Number(adminQuick.court),
      start: sel.start,
      end: sel.end,
      name: adminQuick.block ? "Ocupado" : (adminQuick.name || "Ocupado"),
      phone: adminQuick.block ? "" : (adminQuick.phone || ""),
      email: "",
      paid: false,
      createdAt: Date.now(),
    };

    if (!config.allowOverlap) {
      const conflict = reservas.some(
        (r) =>
          r.date === newRes.date &&
          r.court === newRes.court &&
          overlap(newRes.start, newRes.end, r.start, r.end)
      );
      if (conflict) return alert("Ese horario ya está ocupado en esa cancha.");
    }

    setReservas((prev) => [...prev, newRes]);
    setAdminQuick((q) => ({ ...q, start: "", name: "", phone: "" }));
  }

  function removeReserva(id) {
    if (!admin) {
      alert("Solo el administrador puede eliminar reservas.");
      return;
    }
    if (!window.confirm("¿Eliminar reserva?")) return;
    setReservas((prev) => prev.filter((r) => r.id !== id));
  }

  function togglePaid(id) {
    if (!admin) {
      alert("Solo el administrador puede marcar pagos.");
      return;
    }
    setReservas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, paid: !r.paid } : r))
    );
  }

  function exportCSV() {
    const headers = [
      "fecha",
      "cancha",
      "inicio",
      "fin",
      "nombre",
      "telefono",
      "email",
      "pagado",
    ];
    const lines = reservas.map((r) =>
      [
        r.date,
        r.court,
        r.start,
        r.end,
        r.name,
        r.phone,
        r.email,
        r.paid ? "si" : "no",
      ]
        .map((v) => `"${(v ?? "").toString().replaceAll('"', '""')}"`)
        .join(",")
    );
    downloadFile(
      "reservas.csv",
      [headers.join(","), ...lines].join("\n"),
      "text/csv"
    );
  }
  function exportJSON() {
    downloadFile(
      "reservas.json",
      JSON.stringify(reservas, null, 2),
      "application/json"
    );
  }
  function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data)) setReservas(data);
        else alert("Formato inválido");
      } catch {
        alert("No se pudo leer el JSON");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = dayReservations;
    if (!term) return base;
    return base.filter((r) =>
      [r.name, r.phone, r.email, `c${r.court}`, r.start, r.end]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [dayReservations, search]);

  /* ========= UI (tema oscuro, sin notas) ========= */
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {!admin ? (
        /* ==================== RESERVA (WIZARD) ==================== */
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-c655-card rounded-2xl border border-c655-line p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Reservar turno</h2>

              {/* Progreso visual */}
              <div className="flex items-center gap-2 mb-6">
                {["Fecha", "Cancha", "Horario", "Datos"].map((t, i) => {
                  const n = i + 1;
                  const active = step === n;
                  const done = step > n;
                  return (
                    <div key={t} className="flex items-center gap-2">
                      <div
                        className={
                          "w-8 h-8 rounded-full grid place-items-center text-sm border " +
                          (active
                            ? "bg-c655-y text-black border-transparent"
                            : done
                            ? "bg-c655-bg text-c655-text border-c655-line"
                            : "bg-c655-card text-c655-mute border-c655-line")
                        }
                      >
                        {n}
                      </div>
                      <span className={active ? "text-c655-y font-medium" : "text-c655-mute"}>{t}</span>
                      {n < 4 && <div className="w-8 h-px bg-c655-line mx-2" />}
                    </div>
                  );
                })}
              </div>

              {/* PASO 1 - FECHA */}
              {step === 1 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-sm text-c655-mute">Elegí la fecha</span>
                    <input
                      type="date"
                      value={date}
                      min={TODAY}
                      max={MAX_DATE}
                      onChange={(e) => { setDate(e.target.value); setStart(""); }}
                      className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text"
                    />
                    <div className="text-xs text-c655-mute mt-1">
                      {new Date(date + "T00:00").toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "short" })}
                    </div>
                  </label>
                  <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="px-4 py-2 rounded-xl bg-c655-y text-black"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 2 - CANCHA */}
              {step === 2 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-sm text-c655-mute">Elegí la cancha</span>
                    <select
                      value={court}
                      onChange={(e) => { setCourt(e.target.value); setStart(""); }}
                      className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text"
                    >
                      {Array.from({ length: clamp(config.courts, 1, 20) }, (_, i) => i + 1).map(
                        (c) => (
                          <option key={c} value={c}>
                            Cancha {c}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  {/* Mini estado de la cancha del día elegido */}
                  <div className="sm:col-span-2 border border-c655-line rounded-xl p-3">
                    <div className="font-medium mb-2">Estado de la Cancha {court} – {date}</div>
                    {takenForCourt.length === 0 ? (
                      <div className="text-sm text-c655-mute">Libre todo el día</div>
                    ) : (
                      <ul className="text-sm space-y-1">
                        {takenForCourt
                          .slice()
                          .sort((a, b) => a.start.localeCompare(b.start))
                          .map((r) => (
                            <li key={r.id} className="flex items-center justify-between">
                              <span>{r.start}–{r.end}</span>
                              <span className="truncate max-w-[50%]">{r.name}</span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>

                  <div className="sm:col-span-2 flex justify-between gap-2 mt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-2 rounded-xl bg-c655-card border border-c655-line"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="px-4 py-2 rounded-xl bg-c655-y text-black"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 3 - HORARIO */}
              {step === 3 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-sm text-c655-mute">Elegí un horario disponible</span>
                    <select
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text"
                    >
                      <option value="">Elegí horario…</option>
                      {slots.map(({ start: s, end: e }) => {
                        const ocupado = takenForCourt.some(r => !(toMins(e) <= toMins(r.start) || toMins(s) >= toMins(r.end)));
                        return (
                          <option key={s} value={ocupado ? "" : s} disabled={ocupado}>
                            {s} – {e} {ocupado ? "(Ocupado)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <div className="sm:col-span-2 flex justify-between gap-2 mt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="px-4 py-2 rounded-xl bg-c655-card border border-c655-line"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={() => start ? setStep(4) : alert("Seleccioná un horario")}
                      className="px-4 py-2 rounded-xl bg-c655-y text-black"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 4 - DATOS Y CONFIRMAR */}
              {step === 4 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 text-c655-mute text-sm">
                    Confirmás: <b>{date}</b> · <b>Cancha {court}</b> · <b>{start}</b>
                  </div>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-c655-mute">Nombre</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jugador/a"
                      className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text placeholder:text-c655-mute"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-c655-mute">Teléfono (WhatsApp)</span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 11 5555 5555"
                      className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text placeholder:text-c655-mute"
                    />
                  </label>
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-sm text-c655-mute">Email (opcional)</span>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@correo.com"
                      className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text placeholder:text-c655-mute"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
                    <span className="text-sm">Pagado</span>
                  </label>

                  <div className="sm:col-span-2 flex justify-between gap-2 mt-2">
                    <button
                      onClick={() => setStep(3)}
                      className="px-4 py-2 rounded-xl bg-c655-card border border-c655-line"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleReservar}
                      className="px-4 py-2 rounded-xl bg-c655-y text-black"
                    >
                      Confirmar reserva
                    </button>
                  </div>
                </div>
              )}
            </div>

           
          
          </div>

          {/* Panel lateral: estado por cancha */}
          <aside>
            <div className="bg-c655-card rounded-2xl border border-c655-line p-4 sm:p-6 sticky top-24">
              <h3 className="text-base font-semibold mb-3">Estado por cancha</h3>
              <div className="space-y-3">
                {Array.from({ length: clamp(config.courts, 1, 20) }, (_, i) => i + 1).map(
                  (c) => {
                    const deHoy = dayReservations.filter((r) => r.court === c);
                    return (
                      <div key={c} className="border border-c655-line rounded-xl p-3">
                        <div className="font-medium mb-1">Cancha {c}</div>
                        {deHoy.length === 0 ? (
                          <div className="text-sm text-c655-mute">Libre todo el día</div>
                        ) : (
                          <ul className="text-sm space-y-1">
                            {deHoy.map((r) => (
                              <li
                                key={r.id}
                                className="flex items-center justify-between"
                              >
                                <span>
                                  {r.start}–{r.end}
                                </span>
                                <span className="truncate max-w-[50%]">
                                  {r.name}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </aside>
        </section>
      ) : (
        /* ==================== ADMIN ==================== */
        <section className="space-y-6">
          <div className="bg-c655-card rounded-2xl border border-c655-line p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Panel de administración</h2>
            <p className="text-sm text-c655-mute mb-4">
              Configurá horarios, canchas y exportá datos.
            </p>

            {/* Reserva / Bloqueo rápido */}
            <div className="mb-6 border border-c655-line rounded-xl p-4">
              <div className="font-medium mb-3">Reserva rápida / Bloqueo</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-c655-mute">Fecha</span>
                  <input
                    type="date"
                    value={adminQuick.date}
                    min={TODAY}
                    max={MAX_DATE}
                    onChange={(e) =>
                      setAdminQuick((q) => ({ ...q, date: e.target.value, start: "" }))
                    }
                    className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm text-c655-mute">Cancha</span>
                  <select
                    value={adminQuick.court}
                    onChange={(e) =>
                      setAdminQuick((q) => ({ ...q, court: e.target.value, start: "" }))
                    }
                    className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text"
                  >
                    {Array.from({ length: clamp(config.courts, 1, 20) }, (_, i) => i + 1).map(
                      (c) => (
                        <option key={c} value={c}>Cancha {c}</option>
                      )
                    )}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm text-c655-mute">Horario</span>
                  <select
                    value={adminQuick.start}
                    onChange={(e) =>
                      setAdminQuick((q) => ({ ...q, start: e.target.value }))
                    }
                    className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text"
                  >
                    <option value="">Elegí horario…</option>
                    {buildSlots(config.open, config.close, DURATION).map(({ start: s, end: e }) => {
                      const tk = (Array.isArray(reservas) ? reservas : []).filter(
                        (r) => r.date === adminQuick.date && String(r.court) === String(adminQuick.court)
                      );
                      const ocupado = tk.some(r => !(toMins(e) <= toMins(r.start) || toMins(s) >= toMins(r.end)));
                      return (
                        <option key={s} value={ocupado ? "" : s} disabled={ocupado}>
                          {s} – {e} {ocupado ? "(Ocupado)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={adminQuick.block}
                    onChange={(e) =>
                      setAdminQuick((q) => ({ ...q, block: e.target.checked }))
                    }
                  />
                  <span className="text-sm">Bloquear (sin datos de jugador)</span>
                </label>

                {!adminQuick.block && (
                  <>
                    <label className="flex flex-col gap-1">
                      <span className="text-sm text-c655-mute">Nombre</span>
                      <input
                        value={adminQuick.name}
                        onChange={(e) =>
                          setAdminQuick((q) => ({ ...q, name: e.target.value }))
                        }
                        className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-sm text-c655-mute">Teléfono</span>
                      <input
                        value={adminQuick.phone}
                        onChange={(e) =>
                          setAdminQuick((q) => ({ ...q, phone: e.target.value }))
                        }
                        className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text"
                      />
                    </label>
                  </>
                )}

                <div className="sm:col-span-2 lg:col-span-3">
                  <button
                    onClick={adminQuickAdd}
                    className="px-4 py-2 rounded-xl bg-c655-y text-black"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Configuración básica */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-c655-mute">PIN admin (demo)</span>
                <div className="flex gap-2">
                  <input
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Ingresá PIN"
                    className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text flex-1 placeholder:text-c655-mute"
                  />
                  <button
                    onClick={() => {
                      if (pinInput === config.adminPIN) {
                        alert("Admin habilitado");
                      } else {
                        alert("PIN incorrecto (demo: 1234)");
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-c655-y text-black"
                  >
                    Validar
                  </button>
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-c655-mute">Nombre del complejo</span>
                <input
                  value={config.complexName}
                  onChange={(e) =>
                    setConfig({ ...config, complexName: e.target.value })
                  }
                  className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-c655-mute">Cantidad de canchas</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={config.courts}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      courts: clamp(parseInt(e.target.value || "1"), 1, 20),
                    })
                  }
                  className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-c655-mute">Apertura</span>
                <input
                  type="time"
                  value={config.open}
                  onChange={(e) => setConfig({ ...config, open: toTime(e.target.value) })}
                  className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm text-c655-mute">Cierre</span>
                <input
                  type="time"
                  value={config.close}
                  onChange={(e) => setConfig({ ...config, close: toTime(e.target.value) })}
                  className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text"
                />
              </label>

              <div className="flex flex-col gap-1">
                <span className="text-sm text-c655-mute">Minutos por turno</span>
                <div className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text">
                  90
                </div>
              </div>

              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={config.allowOverlap}
                  onChange={(e) =>
                    setConfig({ ...config, allowOverlap: e.target.checked })
                  }
                />
                <span className="text-sm">Permitir turnos solapados (no recomendado)</span>
              </label>

              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={config.requirePhone}
                  onChange={(e) =>
                    setConfig({ ...config, requirePhone: e.target.checked })
                  }
                />
                <span className="text-sm">Solicitar teléfono obligatorio</span>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={exportCSV}
                className="px-4 py-2 rounded-xl bg-c655-y text-black"
              >
                Exportar CSV
              </button>
              <button
                onClick={exportJSON}
                className="px-4 py-2 rounded-xl bg-c655-card border border-c655-line"
              >
                Exportar JSON
              </button>
              <label className="px-4 py-2 rounded-xl bg-c655-card border border-c655-line cursor-pointer">
                Importar JSON
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={importJSON}
                />
              </label>
              <button
                onClick={() => {
                  if (window.confirm("¿Vaciar todas las reservas?")) setReservas([]);
                }}
                className="px-4 py-2 rounded-xl bg-c655-card border border-c655-line"
              >
                Vaciar reservas
              </button>
            </div>
          </div>

          {/* Tabla admin */}
          <div className="bg-c655-card rounded-2xl border border-c655-line p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-c655-mute">Fecha</span>
                <input
                  type="date"
                  value={date}
                  min={TODAY}
                  max={MAX_DATE}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-c655-mute">Buscar</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nombre, teléfono, hora..."
                  className="px-3 py-2 rounded-xl border border-c655-line bg-c655-bg text-c655-text placeholder:text-c655-mute"
                />
              </label>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-c655-mute border-b border-c655-line">
                    <th className="py-2 pr-4">Hora</th>
                    <th className="py-2 pr-4">Cancha</th>
                    <th className="py-2 pr-4">Nombre</th>
                    <th className="py-2 pr-4">Teléfono</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Pagado</th>
                    <th className="py-2 pr-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td className="py-6 text-c655-mute" colSpan={7}>
                        No hay reservas para esta fecha.
                      </td>
                    </tr>
                  )}
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-c655-line align-top">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {r.start} – {r.end}
                      </td>
                      <td className="py-2 pr-4">{r.court}</td>
                      <td className="py-2 pr-4">{r.name}</td>
                      <td className="py-2 pr-4">{r.phone}</td>
                      <td className="py-2 pr-4">{r.email}</td>
                      <td className="py-2 pr-4">{r.paid ? "Sí" : "No"}</td>
                      <td className="py-2 pr-4 space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => togglePaid(r.id)}
                          className="px-3 py-1 rounded-lg bg-c655-bg border border-c655-line"
                        >
                          Pago
                        </button>
                        <button
                          onClick={() => {
                            const ics = buildICS(r, config.complexName);
                            downloadFile(
                              `reserva-${r.date}-c${r.court}-${r.start}.ics`,
                              ics,
                              "text/calendar"
                            );
                          }}
                          className="px-3 py-1 rounded-lg bg-c655-bg border border-c655-line"
                        >
                          .ics
                        </button>
                        <button
                          onClick={() => removeReserva(r.id)}
                          className="px-3 py-1 rounded-lg bg-c655-bg border border-c655-line"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
