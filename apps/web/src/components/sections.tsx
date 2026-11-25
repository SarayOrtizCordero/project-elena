import { Check, Dumbbell, Smartphone, Star } from "lucide-react";
import { Placeholder, Reveal } from "@elena/ui";
import { marquee, services, steps, testimonials, transformations } from "@/lib/data";

export function Marquee() {
  const items = [...marquee, ...marquee];
  return (
    <div aria-hidden className="-rotate-1 overflow-hidden bg-volt py-3 text-ink">
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
        {[...items, ...items].map((w, i) => (
          <span key={i} className="flex items-center gap-8 font-display text-3xl uppercase sm:text-4xl">
            {w} <Dumbbell className="size-6" />
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div className="mb-12 max-w-2xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-volt">{kicker}</p>
      <h2 className="font-display-tight text-5xl font-extrabold sm:text-6xl lg:text-7xl">{children}</h2>
    </div>
  );
}

export function Services() {
  return (
    <section id="servicios" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <SectionTitle kicker="Servicios">
          Dos formas de <span className="text-volt">llegar a tu meta</span>
        </SectionTitle>
      </Reveal>
      <div className="grid gap-5 md:grid-cols-2">
        {services.map((s, i) => (
          <Reveal key={s.id} delay={i * 0.1}>
            <article className="group h-full rounded-[1.75rem] border border-line bg-ink-2 p-7 transition duration-300 hover:-translate-y-1 hover:border-volt/60 sm:p-9">
              <div className="mb-8 flex items-center justify-between">
                <span className="grid size-14 place-items-center rounded-2xl bg-volt text-ink transition-transform duration-300 group-hover:rotate-6">
                  {s.id === "online" ? <Smartphone className="size-7" /> : <Dumbbell className="size-7" />}
                </span>
                <span className="rounded-full border border-line px-3 py-1 text-xs uppercase tracking-widest text-mute">
                  {s.tag}
                </span>
              </div>
              <h3 className="font-display-tight text-5xl font-bold">{s.title}</h3>
              <p className="mt-4 text-mute">{s.blurb}</p>
              <ul className="mt-6 space-y-3">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-5 shrink-0 text-volt" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Method() {
  return (
    <section id="metodo" className="border-y border-line bg-ink-2">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <SectionTitle kicker="Método">
            Simple, claro y <span className="text-volt">a tu medida</span>
          </SectionTitle>
        </Reveal>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <li className="h-full rounded-3xl border border-line bg-ink p-6 transition-colors hover:border-volt/50">
                <span
                  className="font-display text-7xl text-transparent"
                  style={{ WebkitTextStroke: "1.5px var(--color-volt)" }}
                >
                  {s.n}
                </span>
                <h3 className="mt-3 font-display-tight text-3xl font-bold">{s.title}</h3>
                <p className="mt-3 text-sm text-mute">{s.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Results() {
  return (
    <section id="resultados" className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <SectionTitle kicker="Resultados">
          Personas reales, <span className="text-volt">cambios reales</span>
        </SectionTitle>
      </Reveal>
      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 no-scrollbar md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        {transformations.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.1} className="w-[82%] shrink-0 snap-center md:w-auto">
            <article className="overflow-hidden rounded-3xl border border-line bg-ink-2">
              <div className="grid grid-cols-2 gap-px bg-line">
                <div className="relative">
                  <Placeholder label="Antes" ratio="3/4" />
                  <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                    Antes
                  </span>
                </div>
                <div className="relative">
                  <Placeholder label="Después" ratio="3/4" tone="volt" />
                  <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-volt">
                    Después
                  </span>
                </div>
              </div>
              <div className="flex items-end justify-between p-5">
                <div>
                  <p className="font-display text-3xl leading-none text-volt">{t.result}</p>
                  <p className="mt-1 text-sm text-mute">
                    {t.name} · {t.time}
                  </p>
                </div>
                <span className="rounded-full border border-line px-3 py-1 text-xs text-mute">{t.mode}</span>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <p className="mt-4 text-xs text-mute">Imágenes y datos provisionales de demostración.</p>
    </section>
  );
}

export function About() {
  return (
    <section className="border-y border-line bg-ink-2">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 md:grid-cols-2">
        <Reveal from="left" y={60}>
          <div className="overflow-hidden rounded-[2rem] border border-line">
            <Placeholder label="Elena entrenando (demo)" ratio="1/1" tone="volt" />
          </div>
        </Reveal>
        <Reveal from="right" y={60} delay={0.1}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-volt">Sobre Elena</p>
          <h2 className="font-display-tight text-5xl font-extrabold sm:text-6xl">
            Entrenadora, <span className="text-volt">no gurú</span>
          </h2>
          <p className="mt-6 text-lg text-mute">
            Llevo años acompañando a personas que querían cambiar y no sabían por dónde empezar. Mi método es sencillo:
            un plan realista, datos para medir y ajustes constantes. Sin dietas milagro ni promesas vacías.
          </p>
          <p className="mt-4 text-mute">
            Texto provisional de demostración. Aquí irá la historia real de Elena y sus certificaciones.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <Reveal>
        <SectionTitle kicker="Opiniones">
          Lo que dicen <span className="text-volt">mis clientas</span>
        </SectionTitle>
      </Reveal>
      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.1}>
            <figure className="h-full rounded-3xl border border-line bg-ink-2 p-7">
              <div className="mb-4 flex gap-1 text-volt" aria-label="5 de 5 estrellas">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="size-5 fill-current" />
                ))}
              </div>
              <blockquote className="text-lg">&ldquo;{t.text}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 text-sm">
                <span className="grid size-10 place-items-center rounded-full bg-volt font-display text-lg text-ink">
                  {t.name[0]}
                </span>
                <span>
                  <strong>{t.name}</strong>
                  <span className="block text-mute">{t.mode}</span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
