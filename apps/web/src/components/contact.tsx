"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Send } from "lucide-react";
import { Button, Reveal, RevealText } from "@elena/ui";
import { WHATSAPP_URL } from "@/lib/data";
import { TornEdge } from "./torn-edge";

const field =
  "h-14 w-full rounded-xl border bg-ink px-4 text-base text-bone placeholder:text-mute transition-colors focus:border-white";

type Errors = Partial<Record<"name" | "email" | "consent", string>>;

export function Contact() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const next: Errors = {};
    if (!String(fd.get("name") ?? "").trim()) next.name = "Escribe tu nombre.";
    if (!/^\S+@\S+\.\S+$/.test(String(fd.get("email") ?? ""))) next.email = "Escribe un email válido, por ejemplo nombre@correo.com.";
    if (!fd.get("consent")) next.consent = "Necesitamos tu consentimiento para contactarte.";
    setErrors(next);
    if (Object.keys(next).length) {
      const first = (["name", "email", "consent"] as const).find((k) => next[k]);
      (form.elements.namedItem(first!) as HTMLElement | null)?.focus();
      return;
    }
    setLoading(true);
    // DEMO: aquí irá la llamada real (Supabase / email). Simulamos latencia.
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSent(true);
  }

  return (
    <section id="contacto" className="relative bg-brand text-black">
      <TornEdge className="text-brand" variant={1} />
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:py-32 lg:grid-cols-2">
        <div>
          <Reveal y={10}>
            <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em]">
              <span className="h-px w-8 bg-current" aria-hidden /> Empieza hoy
            </p>
          </Reveal>
          <RevealText
            as="h2"
            text="Tu primer paso, *ahora*"
            accentClassName="text-transparent [-webkit-text-stroke:2px_#000]"
            className="font-display-tight text-3xl font-extrabold sm:text-5xl lg:text-6xl"
          />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-md text-lg font-medium">
              Cuéntame tu objetivo y te respondo con una propuesta a tu medida.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href={WHATSAPP_URL} variant="ink" size="lg">
                Escríbeme por WhatsApp
              </Button>
            </div>
            <dl className="mt-10 space-y-3 text-sm">
              <div>
                <dt className="font-bold uppercase tracking-widest">Dónde</dt>
                <dd>Dirección del gimnasio · por confirmar</dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-widest">Horario</dt>
                <dd>Por confirmar</dd>
              </div>
            </dl>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="rounded-2xl bg-black p-6 text-bone sm:p-8">
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="ok"
                  role="status"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex min-h-80 flex-col items-center justify-center gap-4 text-center"
                >
                  <CheckCircle2 className="size-14 text-accent" aria-hidden />
                  <h3 className="font-display-tight text-3xl font-extrabold">¡Recibido!</h3>
                  <p className="text-mute">Te contactaré muy pronto. (Formulario de demostración: no se envía nada.)</p>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={onSubmit} noValidate exit={{ opacity: 0 }} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-semibold">
                      Nombre
                    </label>
                    <input
                      id="name"
                      name="name"
                      autoComplete="name"
                      placeholder="Tu nombre"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-err" : undefined}
                      className={`${field} ${errors.name ? "border-bad" : "border-line"}`}
                    />
                    {errors.name && (
                      <p id="name-err" className="mt-2 text-sm text-bad">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-semibold">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nombre@correo.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-err" : undefined}
                      className={`${field} ${errors.email ? "border-bad" : "border-line"}`}
                    />
                    {errors.email && (
                      <p id="email-err" className="mt-2 text-sm text-bad">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="mode" className="mb-2 block text-sm font-semibold">
                        Modalidad
                      </label>
                      <select id="mode" name="mode" className={`${field} border-line`} defaultValue="online">
                        <option value="online">Online</option>
                        <option value="presencial">Presencial</option>
                        <option value="hibrido">Híbrido</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="goal" className="mb-2 block text-sm font-semibold">
                        Objetivo
                      </label>
                      <select id="goal" name="goal" className={`${field} border-line`} defaultValue="grasa">
                        <option value="grasa">Perder grasa</option>
                        <option value="musculo">Ganar músculo</option>
                        <option value="salud">Mejorar mi salud</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-start gap-3 text-sm text-mute">
                      <input
                        type="checkbox"
                        name="consent"
                        aria-invalid={!!errors.consent}
                        aria-describedby={errors.consent ? "consent-err" : undefined}
                        className="mt-0.5 size-5 shrink-0 accent-[#FAA307]"
                      />
                      <span>Acepto que traten mis datos para contactarme (política de privacidad por publicar).</span>
                    </label>
                    {errors.consent && (
                      <p id="consent-err" className="mt-2 text-sm text-bad">
                        {errors.consent}
                      </p>
                    )}
                  </div>
                  <Button type="submit" variant="brand" size="lg" className="w-full" disabled={loading}>
                    {loading ? (
                      "Enviando…"
                    ) : (
                      <>
                        Enviar <Send className="size-5" aria-hidden />
                      </>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
