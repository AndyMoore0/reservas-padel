import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function CalendarPicker({ value, onChange }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
      <Calendar
        value={new Date(value)}
        onChange={(d)=>{
          const iso = new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
          onChange?.(iso);
        }}
      />
    </div>
  );
}
