"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button, LogoBadge, RevealText } from "@elena/ui";
import { Photo } from "./photo";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.6 } } };
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Hero() {
  return (
    <section id="inicio" aria-label="Inicio" className="relative isolate overflow-hidden bg-brand pt-16 text-black">
      {/* Foto a sangre: debajo en móvil, a la derecha en escritorio */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-80 sm:h-[26rem] [mask-image:linear-gradient(to_top,#000_55%,transparent)] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[62%] lg:[mask-image:linear-gradient(to_right,transparent,#000_38%)]">
        <Photo
          src="/photos/hero.jpg"
          alt="Mujer entrenando con mancuernas en un gimnasio luminoso"
          sizes="(min-width: 1024px) 62vw, 100vw"
          priority
          className="size-full"
          imgClassName="object-[70%_40%]"
        />
      </div>

      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col justify-between px-5 pb-[21rem] pt-10 sm:pb-[27rem] sm:pt-14 lg:pb-8">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl">
          <motion.p variants={item} className="mb-6 text-xs font-bold uppercase tracking-[0.22em]">
            Entrenadora personal · Entreno y nutrición
          </motion.p>

          <RevealText
            as="h1"
            text={"Tu fuerza\nempieza\naquí"}
            delay={0.15}
            stagger={0.1}
            accentClassName="text-transparent [-webkit-text-stroke:2px_#000]"
            className="font-display-tight text-[clamp(2.7rem,10.5vw,7.5rem)] font-extrabold"
          />

          <motion.p variants={item} className="mt-7 max-w-md text-lg font-medium text-black sm:text-xl">
            Entrenamiento y nutrición a tu medida, en el gym o desde casa, con una app que registra tu progreso.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="#contacto" variant="ink" size="lg">
              Quiero empezar <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
            </Button>
            <a
              href="#planes"
              className="inline-flex h-14 items-center justify-center rounded-full border-2 border-black px-8 font-display text-lg uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
            >
              Ver planes
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7 }}
          className="absolute bottom-6 right-5 flex items-end justify-between gap-6 lg:static lg:mt-12"
        >
          <p className="hidden max-w-[16rem] text-xs font-semibold uppercase leading-relaxed tracking-[0.18em] lg:block">
            Plan personalizado · App de seguimiento · Contacto directo
          </p>
          <span className="shrink-0 rounded-full bg-brand p-1">
            <LogoBadge tone="ink" className="size-20 sm:size-28" />
          </span>
        </motion.div>
      </div>
    </section>
  );
}
