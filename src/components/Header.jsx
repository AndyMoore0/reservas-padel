import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Header({ complexName = "OSAKA PADEL" }) {
  const { pathname } = useLocation();
  const is = (p) => pathname === p;

  return (
    <header className="sticky top-0 z-10 bg-brand-dark/80 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/osaka-logo.png" alt="Logo" className="w-8 h-8 rounded" />
          <h1 className="text-xl sm:text-2xl font-semibold">{complexName}</h1>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-xl text-sm ${is("/") ? "bg-white/20" : "bg-white/10 hover:bg-white/20"}`}
          >
            Inicio
          </Link>
          <Link
            to="/reservar"
            className={`px-3 py-1.5 rounded-xl text-sm ${
              is("/reservar")
                ? "bg-brand-red text-white"
                : "bg-brand-red/90 text-white hover:opacity-90"
            }`}
          >
            Reservar
          </Link>
          <Link
            to="/admin"
            className={`px-3 py-1.5 rounded-xl text-sm ${is("/admin") ? "bg-white/20" : "bg-white/10 hover:bg-white/20"}`}
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
