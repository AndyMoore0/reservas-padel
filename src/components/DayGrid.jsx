import React, { useMemo } from "react";

// helpers (copiados de tu App.js si ya están)
const toMins = (t)=>{const [h,m]=t.split(":").map(Number);return h*60+m;};
const toTime = (m)=>`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;

export default function DayGrid({
  date,                // "YYYY-MM-DD"
  reservas,            // array de reservas
  courts = 4,          // cantidad de canchas
  open = "09:00",
  close = "23:00",
  step = 60,           // minutos por turno
  onPick               // function({start,end,court})
}) {
  const slots = useMemo(() => {
    const arr = []; let m = toMins(open); const end = toMins(close);
    while (m+step <= end) { arr.push([toTime(m), toTime(m+step)]); m+=step; }
    return arr;
  }, [open, close, step]);

  const day = useMemo(()=> reservas.filter(r=>r.date===date), [reservas, date]);

  const isTaken = (c,start,end) =>
      day.some(r => r.court===c && !(toMins(end)<=toMins(r.start) || toMins(start)>=toMins(r.end)));


  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid" style={{gridTemplateColumns:`120px repeat(${courts}, 1fr)`}}>
          {/* header row */}
          <div></div>
          {Array.from({length:courts},(_,i)=>i+1).map(c=>
            <div key={c} className="px-2 py-2 text-center text-white/80 border-b border-white/10">Cancha {c}</div>
          )}
          {/* rows */}
          {slots.map(([start,end]) => (
            <React.Fragment key={start}>
              <div className="px-2 py-2 text-white/60 border-b border-white/10 whitespace-nowrap">{start}–{end}</div>
              {Array.from({length:courts},(_,i)=>i+1).map(c=>{
                const taken = isTaken(c,start,end);
                return (
                  <button
                      key={c}
                        disabled={taken}
                        onClick={()=>onPick?.({start,end,court:c})}
                        className={
                          `m-1 rounded-lg px-2 py-2 text-sm border ` +
                          (taken
                            ? "bg-white/10 border-white/10 text-white/40 cursor-not-allowed"  // << gris, no clickeable
                           : "bg-brand-red/10 hover:bg-brand-red/20 border-brand-red/40 text-white")
                        }
                        title={taken ? "Ocupado" : "Reservar"}
                      >
                        {taken ? "Ocupado" : "Reservar"}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
