import { Logo, LogoBadge, Reveal } from "@elena/ui";
import { APP_URL, INSTAGRAM_URL, WHATSAPP_URL, nav } from "@/lib/data";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-black">
      <Reveal className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-14 md:flex-row md:items-center md:justify-between">
        <div>
          <LogoBadge className="mb-4 size-28" />
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-mute">Entrenamiento personal presencial y online.</p>
        </div>
        <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-mute">
          {nav.map((l) => (
            <a key={l.id} href={`#${l.id}`} className="py-1 hover:text-white">
              {l.label}
            </a>
          ))}
          <a href={APP_URL} className="py-1 hover:text-white">
            Acceso clientes
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de Elena (se abre en otra pestaña)"
            className="grid size-11 place-items-center rounded-full border border-line transition-colors hover:border-white"
          >
            <InstagramIcon />
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center rounded-full border border-line px-5 text-sm transition-colors hover:border-white"
          >
            WhatsApp<span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        </div>
      </Reveal>
      <p className="border-t border-line px-5 py-5 text-center text-xs text-mute">
        © {new Date().getFullYear()} Elena Fit · Web de demostración: textos, precios y fotos de stock provisionales.
      </p>
    </footer>
  );
}
