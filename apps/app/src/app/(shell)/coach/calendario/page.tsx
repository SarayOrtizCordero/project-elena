"use client";

import { TrainerCalendar } from "@/components/trainer/TrainerCalendar";

export default function CalendarioCoach() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display-tight text-5xl font-extrabold sm:text-6xl">
          Calen<span className="text-volt">dario</span>
        </h1>
        <p className="text-mute">Sesiones presenciales reservadas por tus clientes.</p>
      </div>
      <TrainerCalendar />
    </div>
  );
}
