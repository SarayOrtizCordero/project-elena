"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button, Reveal, RevealText, cn } from "@elena/ui";
import { plans } from "@/lib/data";

const tabs = [
  { id: "online", label: "Online" },
  { id: "presencial", label: "Presencial" },
] as const;

export function Plans() {
  const [mode, setMode] = useState<(typeof tabs)[number]["id"]>("online");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKey(e: React.KeyboardEvent, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    setMode(next.id);
    refs.current[next.id]?.focus();
  }

  return (
    <section id="planes" className="border-t border-line">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:py-32">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Reveal y={10}>
              <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-accent">
                <span className="h-px w-8 bg-current" aria-hidden /> Planes
              </p>
            </Reveal>
            <RevealText
              as="h2"
              text="Elige tu *ritmo*"
              accentClassName="text-brand-2"
              className="font-display-tight text-3xl font-extrabold sm:text-5xl lg:text-6xl"
            />
          </div>

          <div role="tablist" aria-label="Modalidad" className="relative flex rounded-full border border-line bg-ink-2 p-1">
            {tabs.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => {
                  refs.current[t.id] = el;
                }}
                id={`tab-${t.id}`}
                role="tab"
                aria-selected={mode === t.id}
                aria-controls="panel-planes"
                tabIndex={mode === t.id ? 0 : -1}
                onClick={() => setMode(t.id)}
                onKeyDown={(e) => onKey(e, i)}
                className={cn(
                  "relative z-10 h-11 rounded-full px-6 font-display text-lg uppercase tracking-wide transition-colors",
                  mode === t.id ? "text-white" : "text-mute hover:text-white",
                )}
              >
                {mode === t.id && (
                  <motion.span
                    layoutId="plan-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-brand"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          key={mode}
          id="panel-planes"
          role="tabpanel"
          aria-labelledby={`tab-${mode}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid gap-5 md:grid-cols-3"
        >
          {plans[mode].map((p, i) => (
            <motion.article
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "relative flex flex-col rounded-2xl border p-7",
                p.featured ? "border-brand bg-brand text-white" : "border-line bg-ink-2",
              )}
            >
              {p.badge && (
                <span className="absolute -top-3 left-7 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand">
                  {p.badge}
                </span>
              )}
              <h3 className="font-display-tight text-3xl font-extrabold">{p.name}</h3>
              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="font-display text-6xl font-extrabold leading-none tabular-nums">{p.price}€</span>
                <span className={cn("text-sm", p.featured ? "text-white" : "text-mute")}>{p.unit}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className={cn("mt-0.5 size-4 shrink-0", p.featured ? "text-white" : "text-accent")} aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button href="#contacto" variant={p.featured ? "light" : "brand"} className="mt-8 w-full">
                Empezar<span className="sr-only"> con el plan {p.name}</span>
              </Button>
            </motion.article>
          ))}
        </motion.div>
        <p className="mt-6 text-xs text-mute">Precios de ejemplo, por confirmar con Elena.</p>
      </div>
    </section>
  );
}
