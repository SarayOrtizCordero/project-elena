"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { Button, Logo, cn } from "@elena/ui";
import { APP_URL, nav, spyIds } from "@/lib/data";

/** Devuelve el id de la sección que cruza el centro de la pantalla. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const active = useActiveSection(spyIds);
  const current = nav.some((n) => n.id === active) ? active : null;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (open) firstLinkRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
    <AnimatePresence>
      {open && (
        <motion.button
          aria-label="Cerrar menú"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-x-0 bottom-0 top-16 z-40 bg-black/50 backdrop-blur-[2px] xl:hidden"
        />
      )}
    </AnimatePresence>
    <header className="glass-nav fixed inset-x-0 top-0 z-50 border-b border-white/10">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5">
        <a href="#inicio" aria-label="Elena Fit, ir al inicio" onClick={() => setOpen(false)} className="shrink-0">
          <Logo />
        </a>

        <nav className="hidden xl:block" aria-label="Principal">
          <ul className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            {nav.map((l) => {
              const on = current === l.id;
              return (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    aria-current={on ? "location" : undefined}
                    className={cn(
                      "flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors",
                      on ? "bg-brand text-black" : "text-bone/80 hover:text-white",
                    )}
                  >
                    {l.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <Button href={APP_URL} variant="ghost">
            Acceso clientes
          </Button>
          <Button href="#contacto" variant="brand">
            Reservar
          </Button>
        </div>

        <button
          ref={buttonRef}
          className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/5 xl:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>

      {/* Menú móvil: desplegable compacto bajo la barra, no pantalla completa */}
      <AnimatePresence>
        {open && (
                      <motion.nav
              id="menu-movil"
              aria-label="Menú móvil"
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ transformOrigin: "top right" }}
              className="glass-nav absolute right-3 border border-white/10 top-[calc(100%+0.5rem)] w-[min(19rem,calc(100vw-1.5rem))] rounded-3xl p-3 xl:hidden"
            >
              <ul>
                {nav.map((l, i) => {
                  const on = current === l.id;
                  return (
                    <li key={l.id}>
                      <a
                        ref={i === 0 ? firstLinkRef : undefined}
                        href={`#${l.id}`}
                        aria-current={on ? "location" : undefined}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex min-h-12 items-center justify-between rounded-2xl px-4 text-lg font-semibold transition-colors",
                          on ? "bg-brand text-black" : "text-white hover:bg-white/10",
                        )}
                      >
                        {l.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2 grid gap-2 border-t border-white/10 pt-3">
                <Button href="#contacto" variant="brand" onClick={() => setOpen(false)}>
                  Reservar
                </Button>
                <Button href={APP_URL} variant="ghost">
                  Acceso clientes
                </Button>
              </div>
            </motion.nav>
        )}
      </AnimatePresence>
    </header>
    </>
  );
}
