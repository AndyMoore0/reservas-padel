import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/40">
      <div className="max-w-6xl mx-auto px-4 py-8 text-xs text-white/70 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>© {new Date().getFullYear()} OSAKA PADEL — Reservas online</div>
        <div className="flex gap-4">
          <a className="underline text-brand-red" href="https://wa.me/5492914163023" target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a className="underline" href="/reservar">Reservar</a>
        </div>
      </div>
    </footer>
  );
}
