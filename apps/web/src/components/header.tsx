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
    document.body.style.overflow = open ? "hidden" : "";
    if (open) firstLinkRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-black">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5">
        <a href="#inicio" aria-label="Elena Fit, ir al inicio" onClick={() => setOpen(false)} className="shrink-0">
          <Logo />
        </a>

        <nav className="hidden lg:block" aria-label="Principal">
          <ul className="flex items-center gap-1 rounded-full border border-line bg-ink-2 p-1">
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

        <div className="hidden items-center gap-3 lg:flex">
          <Button href={APP_URL} variant="ghost">
            Acceso clientes
          </Button>
          <Button href="#contacto" variant="brand">
            Reservar
          </Button>
        </div>

        <button
          ref={buttonRef}
          className="grid size-11 place-items-center rounded-full border border-line bg-ink-2 lg:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="menu-movil"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="menu-movil"
            aria-label="Menú móvil"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 bottom-0 top-16 flex flex-col overflow-y-auto bg-black px-5 pb-8 pt-4 lg:hidden"
          >
            <ul>
              {nav.map((l, i) => {
                const on = current === l.id;
                return (
                  <motion.li
                    key={l.id}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i + 0.05 }}
                  >
                    <a
                      ref={i === 0 ? firstLinkRef : undefined}
                      href={`#${l.id}`}
                      aria-current={on ? "location" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center justify-between border-b border-line py-4 font-display-tight text-3xl font-extrabold",
                        on ? "text-accent" : "text-white",
                      )}
                    >
                      {l.label}
                      {on && <span aria-hidden className="size-2.5 rounded-full bg-accent" />}
                    </a>
                  </motion.li>
                );
              })}
            </ul>
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Button href="#contacto" variant="brand" size="lg" onClick={() => setOpen(false)}>
                Reservar
              </Button>
              <Button href={APP_URL} variant="ghost" size="lg">
                Acceso clientes
              </Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
