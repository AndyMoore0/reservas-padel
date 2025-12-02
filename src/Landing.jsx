// src/Landing.jsx
import React from "react";
import { Link } from "react-router-dom";

const WHATSAPP = "5492915005007"; // <-- CAMBIÁ ACA el número del club (ej: 5492914163023)

// Mensaje de contacto
const MSG = encodeURIComponent(
  "Hola! Quisiera consultar por turnos de pádel en Complejo 655."
);

export default function Landing() {
  return (
    <main>
      {/* HERO */}
      <section className="bg-c655-bg">
        <div className="max-w-5xl mx-auto px-4 py-14 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Reservá tu turno en <span className="text-c655-y">Complejo 655</span>
            </h2>
            <p className="mt-3 text-c655-mute">
              3 Canchas techadas full panoramicas. Elegí fecha y horario online,
              turnos de 90 minutos.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                to="/reservar"
                className="px-5 py-3 rounded-xl bg-c655-y text-black font-medium hover:brightness-95"
              >
                Reservar ahora
              </Link>

              {/* AHORA abre WhatsApp */}
              <a
                href={`https://wa.me/${WHATSAPP}?text=${MSG}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-xl border border-c655-line bg-c655-card"
              >
                Contacto
              </a>
            </div>
          </div>

          {/* Tarjeta con logo */}
          <div className="rounded-2xl bg-c655-card border border-c655-line p-6 flex items-center justify-center">
            <img src="/logo-655.png" alt="Complejo 655" className="h-28 w-28" />
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="max-w-5xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-6">
        {[
          ["Reserva 24/7", "Elegí día y horario desde tu celu."],
          ["Señas / Pagos", "Podés integrar Mercado Pago (a pedido)."],
          ["Recordatorios", "WhatsApp o email automáticos (a pedido)."],
        ].map(([t, d]) => (
          <div key={t} className="bg-c655-card rounded-2xl border border-c655-line p-5">
            <h3 className="font-semibold">{t}</h3>
            <p className="text-sm text-c655-mute mt-1">{d}</p>
          </div>
        ))}
      </section>
{/* CLASES DE PÁDEL */}
<section className="max-w-5xl mx-auto px-4 py-14">
  <h2 className="text-3xl font-bold mb-6 text-center text-c655-y">
    Clases de Pádel
  </h2>
  <p className="text-center text-c655-mute mb-10">
    Entrenamientos personalizados con nuestros profes. Elegí tu horario y
    contactalos directamente por WhatsApp.
  </p>

  <div className="grid sm:grid-cols-2 gap-8">
    {/* Manu Adaro */}
    <div className="bg-c655-card rounded-2xl border border-c655-line p-5 flex flex-col items-center text-center">
      <img
        src="/profe-manu.png" // subí esta imagen al public/
        alt="Manu Adaro"
        className="w-48 h-48 object-cover rounded-xl mb-4"
      />
      <h3 className="text-xl font-semibold text-white">Manu Adaro</h3>
      <p className="text-c655-mute">Lunes a Viernes de 08:00 a 14:00</p>
      <a
        href="https://wa.me/5492954670340?text=Hola%20Manu!%20Quisiera%20consultar%20por%20clases%20de%20p%C3%A1del."
        target="_blank"
        rel="noreferrer"
        className="mt-4 px-5 py-2 rounded-xl bg-c655-y text-black font-medium hover:brightness-95"
      >
        Contactar por WhatsApp
      </a>
    </div>

    {/* Facu Huebra */}
    <div className="bg-c655-card rounded-2xl border border-c655-line p-5 flex flex-col items-center text-center">
      <img
        src="/profe-facu.png" // subí esta imagen al public/
        alt="Facu Huebra"
        className="w-48 h-48 object-cover rounded-xl mb-4"
      />
      <h3 className="text-xl font-semibold text-white">Facu Huebra</h3>
      <p className="text-c655-mute">Lunes a Viernes de 08:00 a 14:00</p>
      <a
        href="https://wa.me/5492984375775?text=Hola%20Facu!%20Quisiera%20consultar%20por%20clases%20de%20p%C3%A1del."
        target="_blank"
        rel="noreferrer"
        className="mt-4 px-5 py-2 rounded-xl bg-c655-y text-black font-medium hover:brightness-95"
      >
        Contactar por WhatsApp
      </a>
    </div>
  </div>
</section>

      {/* UBICACIÓN / CONTACTO */}
      <section id="contacto" className="border-t border-c655-line bg-c655-card">
        <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold">¿Dónde estamos?</h3>
            <p className="text-c655-mute mt-1">Güemes 655, Bahía Blanca</p>
            <p className="text-c655-mute">
              WhatsApp:{" "}
              <a
                className="text-c655-y underline"
                href={`https://wa.me/${WHATSAPP}?text=${MSG}`}
                target="_blank"
                rel="noreferrer"
              >
                +{WHATSAPP}
              </a>
            </p>
            <Link className="text-c655-y underline" to="/reservar">
              Reservar cancha →
            </Link>
          </div>
          <iframe
            title="mapa"
            className="w-full h-72 rounded-xl border border-c655-line"
            src="https://www.google.com/maps?q=G%C3%BCemes%20655%20Bah%C3%ADa%20Blanca&output=embed"
            loading="lazy"
          />
        </div>
      </section>

      {/* Botón flotante de WhatsApp (mismo número) */}
      <a
        href={`https://wa.me/${WHATSAPP}?text=${MSG}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 rounded-full shadow px-4 py-3 bg-c655-y text-black font-medium"
      >
        WhatsApp
      </a>
    </main>
  );
}
