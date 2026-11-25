import { Check, Star } from "lucide-react";
import { Reveal, RevealText, cn } from "@elena/ui";
import { gallery, marquee, services, steps, testimonials, why } from "@/lib/data";
import { Photo } from "./photo";
import { TornEdge } from "./torn-edge";

function Kicker({ children, tone = "dark" }: { children: React.ReactNode; tone?: "dark" | "paper" | "red" }) {
  return (
    <Reveal y={10}>
      <p
        className={cn(
          "mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em]",
          tone === "dark" && "text-accent",
          tone === "paper" && "text-brand",
          tone === "red" && "text-white",
        )}
      >
        <span className="h-px w-8 bg-current" aria-hidden /> {children}
      </p>
    </Reveal>
  );
}

const h2 = "font-display-tight text-3xl font-extrabold sm:text-5xl lg:text-6xl";

/* ───────────── Cinta ───────────── */
export function Marquee() {
  const row = [...marquee, ...marquee];
  return (
    <div aria-hidden className="relative overflow-hidden bg-black py-5">
      <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap">
        {[...row, ...row].map((w, i) => (
          <span key={i} className="flex items-center gap-8 font-display-tight text-4xl font-extrabold sm:text-6xl">
            <span className={i % 2 ? "text-outline text-white" : "text-white"}>{w}</span>
            <span className="text-accent">✺</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Por qué elegirme (papel) ───────────── */
const collage = [
  "lg:left-[2%] lg:top-[6%] lg:-rotate-6",
  "lg:left-[27%] lg:top-[30%] lg:rotate-3",
  "lg:left-[51%] lg:top-[4%] lg:-rotate-2",
  "lg:left-[72%] lg:top-[34%] lg:rotate-6",
];

export function Why() {
  return (
    <section id="por-que" className="paper relative overflow-hidden">
      <TornEdge className="text-paper" variant={0} />
      <div className="mx-auto max-w-7xl px-5 py-24 sm:py-32">
        <Kicker tone="paper">Por qué elegirme</Kicker>
        <RevealText as="h2" text="Entrenar con cabeza, *no a ciegas*" accentClassName="text-brand" className={cn(h2, "max-w-3xl")} />

        <div className="relative mt-14">
          <p
            aria-hidden
            className="font-display-tight pointer-events-none absolute -top-6 left-0 hidden select-none whitespace-nowrap text-[6vw] font-extrabold text-paper-line lg:block"
          >
            Por qué elegirme
          </p>
          <ul className="relative grid gap-4 sm:grid-cols-2 lg:block lg:h-[480px]">
            {why.map((c, i) => (
              <li key={c.n} className={cn("lg:absolute lg:w-[23%]", collage[i])}>
                <Reveal delay={i * 0.1} y={30}>
                  <article
                    className={cn(
                      "h-full p-6 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.45)] lg:min-h-[250px]",
                      i === 1 ? "bg-brand text-white" : i === 3 ? "bg-black text-white" : "bg-white text-paper-ink",
                    )}
                  >
                    <p className={cn("font-display text-sm font-bold tracking-widest", i === 3 ? "text-accent" : i === 1 ? "text-white" : "text-brand")}>
                      {c.n}
                    </p>
                    <h3 className="font-display-tight mt-3 text-2xl font-extrabold">{c.title}</h3>
                    <p className={cn("mt-3 text-sm leading-relaxed", i === 1 || i === 3 ? "text-white" : "text-paper-mute")}>{c.text}</p>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Servicios ───────────── */
export function Services() {
  return (
    <section id="servicios" className="relative bg-black">
      <TornEdge className="text-black" variant={1} />
      <div className="mx-auto max-w-7xl px-5 py-24 sm:py-32">
        <div className="mb-14 max-w-2xl">
          <Kicker>Servicios</Kicker>
          <RevealText as="h2" text="Dos formas de *llegar a tu meta*" accentClassName="text-brand-2" className={h2} />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.12}>
              <article className="relative isolate flex min-h-[560px] flex-col justify-end overflow-hidden rounded-2xl border border-line p-7 sm:p-9">
                <div className="absolute inset-0 -z-10">
                  <Photo src={s.photo} alt={s.alt} sizes="(min-width: 1024px) 50vw, 100vw" className="size-full" />
                </div>
                <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/70 to-black/10" />
                <span className="absolute left-7 top-7 rounded-full bg-black px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-accent sm:left-9 sm:top-9">
                  {s.tag}
                </span>
                <h3 className="font-display-tight text-3xl font-extrabold min-[400px]:text-4xl sm:text-5xl lg:text-6xl">{s.title}</h3>
                <p className="mt-4 max-w-md text-bone">{s.blurb}</p>
                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Método ───────────── */
export function Method() {
  return (
    <section id="metodo" className="border-t border-line">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:py-32">
        <div className="mb-14 max-w-2xl">
          <Kicker>Método</Kicker>
          <RevealText as="h2" text="Simple, claro y *a tu medida*" accentClassName="text-brand-2" className={h2} />
        </div>
        <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.n}>
              <Reveal delay={i * 0.1}>
                <div className="border-t-2 border-brand pt-6">
                  <span aria-hidden className="font-display text-7xl font-extrabold text-transparent [-webkit-text-stroke:1.5px_var(--color-accent)]">
                    {s.n}
                  </span>
                  <h3 className="font-display-tight mt-4 text-2xl font-extrabold">
                    <span className="sr-only">Paso {s.n}: </span>
                    {s.title}
                  </h3>
                  <p className="mt-3 text-mute">{s.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────── Galería ───────────── */
export function Gallery() {
  return (
    <section id="galeria" className="border-t border-line">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:py-32">
        <div className="mb-14 max-w-2xl">
          <Kicker>Galería</Kicker>
          <RevealText as="h2" text="Así se *entrena* aquí" accentClassName="text-brand-2" className={h2} />
        </div>
        <ul className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[200px] md:grid-cols-4 md:gap-4">
          {gallery.map((g, i) => (
            <li key={g.src} className={cn("min-h-0", g.cls)}>
              <Reveal delay={(i % 3) * 0.1} className="size-full">
                <figure className="group relative size-full overflow-hidden rounded-xl">
                  <Photo
                    src={g.src}
                    alt={g.alt}
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="size-full"
                    imgClassName="transition-transform duration-700 group-hover:scale-105"
                  />
                  <figcaption className="absolute bottom-3 left-3 rounded-full bg-black px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
                    {g.label}
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
        <Reveal y={8}>
          <p className="mt-5 text-xs text-mute">Fotografías de stock provisionales. Se sustituirán por imágenes reales de Elena.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────── Sobre Elena (papel) ───────────── */
export function About() {
  return (
    <section id="sobre-elena" className="paper relative">
      <TornEdge className="text-paper" variant={2} />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 sm:py-32 md:grid-cols-2">
        <Reveal from="left" y={40}>
          <div className="relative">
            <Photo
              src="/photos/strong.jpg"
              alt="Mujer estirando los brazos en un estudio de entrenamiento"
              sizes="(min-width: 768px) 45vw, 100vw"
              className="aspect-[4/5] w-full"
            />
            <p className="absolute -bottom-4 right-4 bg-black px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
              Foto de ejemplo
            </p>
          </div>
        </Reveal>
        <div>
          <Kicker tone="paper">Sobre Elena</Kicker>
          <RevealText as="h2" text="Entrenadora, *no gurú*" accentClassName="text-brand" className={h2} />
          <Reveal delay={0.2}>
            <p className="mt-6 text-lg text-paper-ink">
              Acompaño a personas que quieren cambiar y no saben por dónde empezar. Mi método es sencillo: un plan
              realista, datos para medir y ajustes constantes. Sin dietas milagro ni promesas vacías.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mt-4 text-paper-mute">
              Texto provisional. Aquí irán la historia real de Elena, su formación y sus certificaciones.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Opiniones ───────────── */
export function Testimonials() {
  return (
    <section id="opiniones" className="relative bg-black">
      <TornEdge className="text-black" variant={0} />
      <div className="mx-auto max-w-7xl px-5 py-24 sm:py-32">
        <div className="mb-14 max-w-2xl">
          <Kicker>Opiniones</Kicker>
          <RevealText as="h2" text="Lo que dirán *mis clientas*" accentClassName="text-brand-2" className={h2} />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.12}>
              <figure className="h-full rounded-2xl border border-line bg-ink-2 p-7">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-1 text-accent" role="img" aria-label="5 de 5 estrellas">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className="size-4 fill-current" aria-hidden />
                    ))}
                  </div>
                  <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-mute">
                    Ejemplo
                  </span>
                </div>
                <blockquote className="text-lg">&ldquo;{t.text}&rdquo;</blockquote>
                <figcaption className="mt-6 text-sm">
                  <strong>{t.name}</strong>
                  <span className="block text-mute">{t.mode}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
