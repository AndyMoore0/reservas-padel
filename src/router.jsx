import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import ReservasPadelApp from "./App";
import Landing from "./Landing";

export default function AppRouter() {
  return (
    <div className="min-h-screen bg-c655-bg text-c655-text">
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/reservar" element={<ReservasPadelApp />} />
        <Route path="/administrador" element={<ReservasPadelApp startAdmin={true} />} />
      </Routes>
    </div>
  );
}

function Header() {
  const base =
    "px-3 py-1.5 rounded-xl text-sm border border-c655-line bg-c655-card text-c655-text";
  const active = "bg-c655-y text-black border-transparent";
  return (
    <header className="sticky top-0 z-10 bg-c655-bg/90 backdrop-blur border-b border-c655-line">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-655.png" alt="Complejo 655" className="h-8 w-8 rounded" />
          <h1 className="text-xl sm:text-2xl font-semibold">Complejo 655</h1>
        </div>
        <nav className="flex items-center gap-2">
          <NavLink to="/" className={({isActive}) => isActive ? `${base} ${active}` : base}>
            Inicio
          </NavLink>
          <NavLink to="/reservar" className={({isActive}) => isActive ? `${base} ${active}` : base}>
            Reservar
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
    