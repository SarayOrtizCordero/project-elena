"use client";

import { TemplateManager } from "@/components/trainer/TemplateManager";

export default function Plantillas() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display-tight text-5xl font-extrabold sm:text-6xl">
          Planti<span className="text-volt">llas</span>
        </h1>
        <p className="text-mute">Carpetas con rutinas y planes de comida reutilizables.</p>
      </div>
      <TemplateManager />
    </div>
  );
}
