"use client";

import { BookingSelector } from "@/components/client/BookingSelector";

export default function Reservas() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display-tight text-5xl font-extrabold sm:text-6xl">
          Reservar <span className="text-volt">sesión</span>
        </h1>
        <p className="text-mute">Entrenamiento presencial · lunes a viernes.</p>
      </div>
      <BookingSelector />
    </div>
  );
}
