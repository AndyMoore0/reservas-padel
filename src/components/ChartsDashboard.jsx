import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
         LineChart, Line, PieChart, Pie, Legend } from "recharts";

export default function ChartsDashboard({ reservas, config }) {
  const ocupacionHora = useMemo(()=>{
    const m = {}; reservas.forEach(r=>{ m[r.start] = (m[r.start]||0)+1; });
    return Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0])).map(([h,c])=>({hora:h,reservas:c}));
  }, [reservas]);

  const porDia = useMemo(()=>{
    const m = {}; reservas.forEach(r=>{ m[r.date]=(m[r.date]||0)+1; });
    return Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0])).map(([d,c])=>({fecha:d,reservas:c}));
  }, [reservas]);

  const pagos = useMemo(()=>{
    let si=0,no=0; reservas.forEach(r=> r.paid?si++:no++);
    return [{name:"Pagado",value:si},{name:"Pendiente",value:no}];
  }, [reservas]);

  const porCancha = useMemo(()=>{
    const m = {}; reservas.forEach(r=>{ m[r.court]=(m[r.court]||0)+1; });
    return Array.from({length:config.courts||4},(_,i)=>i+1).map(c=>({cancha:`${c}`, reservas:m[c]||0}));
  }, [reservas, config.courts]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h3 className="font-semibold mb-3">Ocupación por hora</h3>
        <div style={{height:260}}>
          <ResponsiveContainer>
            <BarChart data={ocupacionHora}>
              <XAxis dataKey="hora" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="reservas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h3 className="font-semibold mb-3">Turnos por día</h3>
        <div style={{height:260}}>
          <ResponsiveContainer>
            <LineChart data={porDia}>
              <XAxis dataKey="fecha" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line dataKey="reservas" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h3 className="font-semibold mb-3">Pagado vs pendiente</h3>
        <div style={{height:260}}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pagos} dataKey="value" nameKey="name" label />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h3 className="font-semibold mb-3">Reservas por cancha</h3>
        <div style={{height:260}}>
          <ResponsiveContainer>
            <BarChart data={porCancha}>
              <XAxis dataKey="cancha" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="reservas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
